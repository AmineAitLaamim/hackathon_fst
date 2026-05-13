from rest_framework import serializers

from accounts.serializers import PublicUserSerializer
from friends.models import Friendship


class FriendRequestCreateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)


class FriendRequestRespondSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["accepted", "declined"])


class FriendshipSerializer(serializers.ModelSerializer):
    requester = PublicUserSerializer(read_only=True)
    addressee = PublicUserSerializer(read_only=True)
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = [
            "id",
            "requester",
            "addressee",
            "other_user",
            "status",
            "created_at",
            "responded_at",
        ]
        read_only_fields = fields

    def get_other_user(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        return PublicUserSerializer(obj.other_user(request.user)).data
