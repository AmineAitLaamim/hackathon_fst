from django.db.models import Avg, Count
from rest_framework import serializers

from shared_tours.models import SharedTourRating
from tours.models import Tour, TourShare
from tours.serializers import TourSerializer


class SharedTourListSerializer(serializers.ModelSerializer):
    share_id = serializers.UUIDField(read_only=True)
    tour_id = serializers.IntegerField(source="tour.id", read_only=True)
    title = serializers.CharField(source="tour.title", read_only=True)
    description = serializers.CharField(source="tour.description", read_only=True)
    author = serializers.CharField(source="tour.owner.full_name", read_only=True)
    stop_count = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    rating_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = TourShare
        fields = [
            "share_id",
            "tour_id",
            "title",
            "description",
            "author",
            "stop_count",
            "average_rating",
            "rating_count",
            "published_at",
        ]

    def get_stop_count(self, obj):
        return len(obj.tour.stops or [])


class SharedTourDetailSerializer(SharedTourListSerializer):
    tour = TourSerializer(read_only=True)

    class Meta(SharedTourListSerializer.Meta):
        fields = SharedTourListSerializer.Meta.fields + ["tour", "settings"]


class RatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = SharedTourRating
        fields = ["id", "rating", "comment", "user", "user_name", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "user_name", "created_at", "updated_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class PersonalizeSharedTourSerializer(serializers.Serializer):
    duration = serializers.IntegerField(min_value=1, max_value=14, required=False)
    budget = serializers.CharField(max_length=120, required=False, allow_blank=True)
    themes = serializers.ListField(child=serializers.CharField(max_length=120), required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


def shared_tour_queryset():
    return TourShare.objects.filter(is_active=True, tour__status=Tour.Status.PUBLISHED).select_related(
        "tour",
        "tour__owner",
    ).annotate(
        average_rating=Avg("ratings__rating"),
        rating_count=Count("ratings"),
    )
