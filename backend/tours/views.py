from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from tours.models import Tour, TourInvitation, TourShare
from tours.serializers import (
    InvitationCreateSerializer,
    TourGenerateSerializer,
    TourInvitationSerializer,
    TourSerializer,
    TourShareSerializer,
)
from tours.services import build_generated_tour

User = get_user_model()


class TourViewSet(viewsets.ModelViewSet):
    serializer_class = TourSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Tour.objects.filter(owner=self.request.user).select_related("share")

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        serializer = TourGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tour = build_generated_tour(user=request.user, payload=serializer.validated_data)
        return Response(TourSerializer(tour).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="shared-with-me")
    def shared_with_me(self, request):
        invitations = TourInvitation.objects.filter(
            recipient=request.user,
            status__in=[TourInvitation.Status.PENDING, TourInvitation.Status.ACCEPTED],
        ).select_related("tour", "sender")
        serializer = TourInvitationSerializer(invitations, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"], url_path="invitations")
    def invitations(self, request, pk=None):
        tour = self.get_object()
        serializer = InvitationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipients = User.objects.filter(id__in=serializer.validated_data["friend_ids"]).exclude(id=request.user.id)
        created = []
        for recipient in recipients:
            invitation, _ = TourInvitation.objects.update_or_create(
                tour=tour,
                recipient=recipient,
                defaults={"sender": request.user, "status": TourInvitation.Status.PENDING},
            )
            created.append(invitation)
        return Response(TourInvitationSerializer(created, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post", "patch", "delete"], url_path="share")
    def share(self, request, pk=None):
        tour = self.get_object()
        if request.method == "POST":
            share, _ = TourShare.objects.update_or_create(
                tour=tour,
                defaults={"is_active": True, "settings": request.data or {}},
            )
            tour.status = Tour.Status.PUBLISHED
            tour.save(update_fields=["status"])
            return Response(TourShareSerializer(share).data, status=status.HTTP_201_CREATED)
        if request.method == "PATCH":
            share = get_object_or_404(TourShare, tour=tour, is_active=True)
            share.settings = {**share.settings, **request.data}
            share.save(update_fields=["settings", "updated_at"])
            if tour.status != Tour.Status.SHARED:
                tour.status = Tour.Status.SHARED
                tour.save(update_fields=["status"])
            return Response(TourShareSerializer(share).data)
        share = get_object_or_404(TourShare, tour=tour, is_active=True)
        share.is_active = False
        share.save(update_fields=["is_active", "updated_at"])
        tour.status = Tour.Status.DRAFT
        tour.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)
