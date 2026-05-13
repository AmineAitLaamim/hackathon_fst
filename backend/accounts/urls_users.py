from django.urls import path

from accounts.views import UserDetailView, UserHealthView, UserInterestsView

urlpatterns = [
    path("<int:pk>", UserDetailView.as_view(), name="user-detail"),
    path("<int:pk>/interests", UserInterestsView.as_view(), name="user-interests"),
    path("<int:pk>/health", UserHealthView.as_view(), name="user-health"),
]
