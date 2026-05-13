from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
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


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        path="/",
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"], path="/")


def _token_payload_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        access_token, refresh_token = _token_payload_for_user(user)
        response = Response(
            {"access": access_token, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        _set_refresh_cookie(response, refresh_token)
        return response

    @action(detail=False, methods=["post"], url_path="login")
    def login(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        access_token, refresh_token = _token_payload_for_user(user)
        response = Response({"access": access_token, "user": UserSerializer(user).data})
        _set_refresh_cookie(response, refresh_token)
        return response

    @action(detail=False, methods=["post"], url_path="logout", permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"])
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_refresh_cookie(response)
        return response

    @action(detail=False, methods=["post"], url_path="refresh")
    def refresh(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"])
        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)
        response = Response({"access": serializer.validated_data["access"]})
        if "refresh" in serializer.validated_data:
            _set_refresh_cookie(response, serializer.validated_data["refresh"])
        return response

    @action(
        detail=False,
        methods=["get", "patch"],
        url_path="me",
        permission_classes=[permissions.IsAuthenticated],
    )
    def me(self, request):
        if request.method == "GET":
            return Response(UserSerializer(request.user).data)
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        return Response(PublicUserSerializer(user).data)

    @action(detail=True, methods=["patch"], url_path="interests")
    def interests(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        if user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = MergeListSerializer(data={"items": request.data.get("interests", [])})
        serializer.is_valid(raise_exception=True)
        user.interests = list(dict.fromkeys([*user.interests, *serializer.validated_data["items"]]))
        user.save(update_fields=["interests"])
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["patch"], url_path="health")
    def health(self, request, pk=None):
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
