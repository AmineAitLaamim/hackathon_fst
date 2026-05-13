from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from shared_tours.models import SharedTourRating
from shared_tours.serializers import (
    PersonalizeSharedTourSerializer,
    RatingSerializer,
    SharedTourDetailSerializer,
    SharedTourListSerializer,
    shared_tour_queryset,
)
from tours.models import Tour
from tours.serializers import TourSerializer


class SharedTourViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _share(self, share_id):
        return get_object_or_404(shared_tour_queryset(), share_id=share_id)

    def list(self, request):
        sort = request.query_params.get("sort", "recent")
        shares = shared_tour_queryset()
        if sort == "rating":
            shares = shares.order_by("-average_rating", "-rating_count", "-published_at")
        else:
            shares = shares.order_by("-published_at")
        page = self.paginator.paginate_queryset(shares, request, view=self) if hasattr(self, "paginator") else None
        if page is not None:
            serializer = SharedTourListSerializer(page, many=True)
            return self.paginator.get_paginated_response(serializer.data)
        return Response(SharedTourListSerializer(shares, many=True).data)

    def retrieve(self, request, pk=None):
        return Response(SharedTourDetailSerializer(self._share(pk)).data)

    @action(detail=True, methods=["get"], url_path="rate/me")
    def my_rating(self, request, pk=None):
        share = self._share(pk)
        rating = get_object_or_404(SharedTourRating, share=share, user=request.user)
        return Response(RatingSerializer(rating).data)

    @action(detail=True, methods=["post", "put", "delete"], url_path="rate")
    def rate(self, request, pk=None):
        share = self._share(pk)
        if request.method == "DELETE":
            rating = get_object_or_404(SharedTourRating, share=share, user=request.user)
            rating.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        existing = SharedTourRating.objects.filter(share=share, user=request.user).first()
        if request.method == "PUT" and not existing:
            return Response({"detail": "No existing rating found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RatingSerializer(existing, data=request.data, partial=request.method == "PUT")
        serializer.is_valid(raise_exception=True)
        rating = serializer.save(share=share, user=request.user)
        return Response(RatingSerializer(rating).data, status=status.HTTP_201_CREATED if request.method == "POST" else 200)

    @action(detail=True, methods=["post"], url_path="use")
    def use(self, request, pk=None):
        share = self._share(pk)
        source = share.tour
        tour = Tour.objects.create(
            owner=request.user,
            title=source.title,
            description=source.description,
            duration=source.duration,
            budget=source.budget,
            themes=source.themes,
            notes=source.notes,
            stops=source.stops,
            status=Tour.Status.DRAFT,
        )
        return Response(TourSerializer(tour).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="personalize")
    def personalize(self, request, pk=None):
        share = self._share(pk)
        serializer = PersonalizeSharedTourSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        source = share.tour
        tour = Tour.objects.create(
            owner=request.user,
            title=f"{source.title} - personalized",
            description=source.description,
            duration=serializer.validated_data.get("duration", source.duration),
            budget=serializer.validated_data.get("budget", source.budget),
            themes=serializer.validated_data.get("themes", source.themes),
            notes=serializer.validated_data.get("notes", source.notes),
            stops=source.stops,
            status=Tour.Status.DRAFT,
        )
        return Response({"tour_id": tour.id, "status": tour.status}, status=status.HTTP_201_CREATED)
