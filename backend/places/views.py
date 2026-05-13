from rest_framework import filters, mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from places.models import Place
from places.serializers import PlaceSerializer


class PlaceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "category", "description", "tags"]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__iexact=category)
        return queryset

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        categories = (
            Place.objects.order_by("category")
            .values_list("category", flat=True)
            .distinct()
        )
        return Response(list(categories))
