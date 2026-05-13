from django.conf import settings
from django.db import models

from tours.models import Tour


class GroupTourSession(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ENDED = "ended", "Ended"

    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name="group_sessions")
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_group_sessions",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    last_activity_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class GroupTourMember(models.Model):
    class Status(models.TextChoices):
        INVITED = "invited", "Invited"
        JOINED = "joined", "Joined"
        LEFT = "left", "Left"

    session = models.ForeignKey(GroupTourSession, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="group_tour_memberships",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INVITED)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_group_tour_invites",
    )
    joined_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["session", "user"], name="unique_group_tour_member")
        ]


class GroupTourActivity(models.Model):
    session = models.ForeignKey(GroupTourSession, on_delete=models.CASCADE, related_name="activities")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=40)
    stop_id = models.CharField(max_length=120, blank=True)
    message = models.TextField(blank=True)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class GroupStopCheckIn(models.Model):
    session = models.ForeignKey(GroupTourSession, on_delete=models.CASCADE, related_name="checkins")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stop_id = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["session", "user", "stop_id"], name="unique_group_stop_checkin")
        ]
        ordering = ["-created_at"]


class GroupStopComment(models.Model):
    session = models.ForeignKey(GroupTourSession, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stop_id = models.CharField(max_length=120)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
