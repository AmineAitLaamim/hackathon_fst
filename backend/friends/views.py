from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from friends.models import Friendship
from friends.serializers import (
    FriendRequestCreateSerializer,
    FriendRequestRespondSerializer,
    FriendshipSerializer,
)

User = get_user_model()


class FriendViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        friendships = Friendship.objects.filter(
            Q(requester=request.user) | Q(addressee=request.user),
            status=Friendship.Status.ACCEPTED,
        ).select_related("requester", "addressee")
        return Response(FriendshipSerializer(friendships, many=True, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="request")
    def request_friend(self, request):
        serializer = FriendRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = get_object_or_404(User, pk=serializer.validated_data["user_id"])
        if target == request.user:
            return Response({"detail": "You cannot send a friend request to yourself."}, status=400)

        existing = Friendship.objects.filter(
            Q(requester=request.user, addressee=target) | Q(requester=target, addressee=request.user)
        ).first()
        if existing:
            if existing.status == Friendship.Status.DECLINED:
                existing.requester = request.user
                existing.addressee = target
                existing.status = Friendship.Status.PENDING
                existing.responded_at = None
                existing.save(update_fields=["requester", "addressee", "status", "responded_at"])
            return Response(FriendshipSerializer(existing, context={"request": request}).data, status=200)

        friendship = Friendship.objects.create(requester=request.user, addressee=target)
        return Response(FriendshipSerializer(friendship, context={"request": request}).data, status=201)

    @action(detail=False, methods=["get"], url_path="requests")
    def requests(self, request):
        request_type = request.query_params.get("type", "incoming")
        if request_type == "outgoing":
            friendships = Friendship.objects.filter(requester=request.user, status=Friendship.Status.PENDING)
        else:
            friendships = Friendship.objects.filter(addressee=request.user, status=Friendship.Status.PENDING)
        friendships = friendships.select_related("requester", "addressee")
        return Response(FriendshipSerializer(friendships, many=True, context={"request": request}).data)

    @action(detail=True, methods=["patch"], url_path="respond")
    def respond(self, request, pk=None):
        friendship = get_object_or_404(Friendship, pk=pk, addressee=request.user)
        if friendship.status != Friendship.Status.PENDING:
            return Response({"detail": "This request has already been handled."}, status=400)
        serializer = FriendRequestRespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        friendship.status = serializer.validated_data["status"]
        friendship.responded_at = timezone.now()
        friendship.save(update_fields=["status", "responded_at"])
        return Response(FriendshipSerializer(friendship, context={"request": request}).data)

    def destroy(self, request, pk=None):
        friendship = get_object_or_404(
            Friendship.objects.filter(Q(requester=request.user) | Q(addressee=request.user)),
            pk=pk,
        )
        friendship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
