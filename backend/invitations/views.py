from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.response import Response

from invitations.serializers import InvitationSerializer, InvitationUpdateSerializer
from tours.models import TourInvitation


class InvitationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        invitations = TourInvitation.objects.filter(
            recipient=request.user,
            status=TourInvitation.Status.PENDING,
        ).select_related("sender", "recipient", "tour", "tour__owner", "tour__share")
        return Response(InvitationSerializer(invitations, many=True).data)

    def partial_update(self, request, pk=None):
        invitation = get_object_or_404(TourInvitation, pk=pk, recipient=request.user)
        serializer = InvitationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation.status = serializer.validated_data["status"]
        invitation.save(update_fields=["status"])
        return Response(InvitationSerializer(invitation).data)
