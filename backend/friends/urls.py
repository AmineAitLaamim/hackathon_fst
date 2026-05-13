from rest_framework.routers import DefaultRouter

from friends.views import FriendViewSet

router = DefaultRouter()
router.register("", FriendViewSet, basename="friends")

urlpatterns = router.urls
