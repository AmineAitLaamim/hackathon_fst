from rest_framework.routers import DefaultRouter

from tours.views import TourViewSet

router = DefaultRouter()
router.register("", TourViewSet, basename="tour")

urlpatterns = router.urls
