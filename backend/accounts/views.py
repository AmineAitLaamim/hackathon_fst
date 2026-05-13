from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from accounts.serializers import (
    LoginSerializer,
    MergeListSerializer,
    ProfileUpdateSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    UserSerializer,
)


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        path="/",
    )


def clear_refresh_cookie(response):
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"], path="/")


def issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        access_token, refresh_token = issue_tokens(user)
        response = Response(
            {"access": access_token, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        set_refresh_cookie(response, refresh_token)
        return response


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        access_token, refresh_token = issue_tokens(user)
        response = Response({"access": access_token, "user": UserSerializer(user).data})
        set_refresh_cookie(response, refresh_token)
        return response


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"])
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"])
        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)
        response = Response({"access": serializer.validated_data["access"]})
        if "refresh" in serializer.validated_data:
            set_refresh_cookie(response, serializer.validated_data["refresh"])
        return response


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class UserDetailView(APIView):
    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        return Response(PublicUserSerializer(user).data)


class UserInterestsView(APIView):
    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = MergeListSerializer(data={"items": request.data.get("interests", [])})
        serializer.is_valid(raise_exception=True)
        user.interests = list(dict.fromkeys([*user.interests, *serializer.validated_data["items"]]))
        user.save(update_fields=["interests"])
        return Response(UserSerializer(user).data)


class UserHealthView(APIView):
    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = MergeListSerializer(data={"items": request.data.get("health_conditions", [])})
        serializer.is_valid(raise_exception=True)
        user.health_conditions = list(
            dict.fromkeys([*user.health_conditions, *serializer.validated_data["items"]])
        )
        user.save(update_fields=["health_conditions"])
        return Response(UserSerializer(user).data)
