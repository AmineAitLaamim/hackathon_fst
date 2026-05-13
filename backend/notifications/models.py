from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        FRIEND_REQUEST = "friend_request", "Friend request"
        TOUR_INVITATION = "tour_invitation", "Tour invitation"
        GROUP_CHECKIN = "group_checkin", "Group check-in"
        GROUP_INVITATION = "group_invitation", "Group invitation"
        SYSTEM = "system", "System"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="triggered_notifications",
    )
    type = models.CharField(max_length=40, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    data = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_read(self):
        return self.read_at is not None
