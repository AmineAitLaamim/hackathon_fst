from rest_framework import serializers

from tours.models import TourInvitation
from tours.serializers import TourSerializer


class InvitationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    tour_title = serializers.CharField(source="tour.title", read_only=True)
    tour_preview = TourSerializer(source="tour", read_only=True)

    class Meta:
        model = TourInvitation
        fields = [
            "id",
            "tour",
            "tour_title",
            "tour_preview",
            "sender",
            "sender_name",
            "recipient",
            "status",
            "created_at",
        ]
        read_only_fields = fields


class InvitationUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["accepted", "declined"])
