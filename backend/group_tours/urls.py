from rest_framework.routers import DefaultRouter

from group_tours.views import GroupTourViewSet

router = DefaultRouter()
router.register("", GroupTourViewSet, basename="group-tours")

urlpatterns = router.urls
