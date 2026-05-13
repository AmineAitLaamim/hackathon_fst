from rest_framework.routers import DefaultRouter

from shared_tours.views import SharedTourViewSet

router = DefaultRouter()
router.register("", SharedTourViewSet, basename="shared-tours")

urlpatterns = router.urls
