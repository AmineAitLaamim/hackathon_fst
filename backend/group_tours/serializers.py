from rest_framework import serializers

from accounts.serializers import PublicUserSerializer
from group_tours.models import (
    GroupStopCheckIn,
    GroupStopComment,
    GroupTourActivity,
    GroupTourMember,
    GroupTourSession,
)
from tours.models import Tour
from tours.serializers import TourSerializer


class GroupTourCreateSerializer(serializers.Serializer):
    tour_id = serializers.IntegerField(min_value=1)

    def validate_tour_id(self, value):
        request = self.context["request"]
        if not Tour.objects.filter(pk=value, owner=request.user).exists():
            raise serializers.ValidationError("Tour not found.")
        return value


class GroupInviteSerializer(serializers.Serializer):
    friend_ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False)


class GroupCommentCreateSerializer(serializers.Serializer):
    comment = serializers.CharField(allow_blank=False)


class GroupMemberSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = GroupTourMember
        fields = ["id", "user", "status", "invited_by", "joined_at", "created_at"]
        read_only_fields = fields


class GroupActivitySerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = GroupTourActivity
        fields = ["id", "user", "type", "stop_id", "message", "payload", "created_at"]
        read_only_fields = fields


class GroupCheckInSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = GroupStopCheckIn
        fields = ["id", "user", "stop_id", "created_at"]
        read_only_fields = fields


class GroupCommentSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = GroupStopComment
        fields = ["id", "user", "stop_id", "comment", "created_at"]
        read_only_fields = ["id", "user", "stop_id", "created_at"]


class GroupSessionSerializer(serializers.ModelSerializer):
    tour = TourSerializer(read_only=True)
    host = PublicUserSerializer(read_only=True)
    members = GroupMemberSerializer(many=True, read_only=True)

    class Meta:
        model = GroupTourSession
        fields = ["id", "tour", "host", "status", "members", "last_activity_at", "created_at"]
        read_only_fields = fields
