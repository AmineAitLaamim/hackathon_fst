from rest_framework import serializers

from tours.models import Tour, TourInvitation, TourShare


class TourSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source="owner.id", read_only=True)
    share_id = serializers.UUIDField(source="share.share_id", read_only=True)

    class Meta:
        model = Tour
        fields = [
            "id",
            "owner_id",
            "title",
            "description",
            "duration",
            "budget",
            "themes",
            "notes",
            "status",
            "stops",
            "share_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner_id", "share_id", "created_at", "updated_at"]


class TourGenerateSerializer(serializers.Serializer):
    duration = serializers.IntegerField(min_value=1, max_value=14)
    budget = serializers.CharField(max_length=120)
    themes = serializers.ListField(child=serializers.CharField(max_length=120), allow_empty=True)
    notes = serializers.CharField(allow_blank=True, required=False)


class InvitationCreateSerializer(serializers.Serializer):
    friend_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )


class TourInvitationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    tour_title = serializers.CharField(source="tour.title", read_only=True)

    class Meta:
        model = TourInvitation
        fields = ["id", "tour", "tour_title", "sender", "sender_name", "recipient", "status", "created_at"]
        read_only_fields = fields


class TourShareSerializer(serializers.ModelSerializer):
    share_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = TourShare
        fields = ["share_id", "is_active", "settings", "published_at", "updated_at"]
        read_only_fields = ["share_id", "published_at", "updated_at"]
