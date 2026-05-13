from rest_framework import serializers

from accounts.serializers import PublicUserSerializer
from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor = PublicUserSerializer(read_only=True)
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "message",
            "data",
            "actor",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields
