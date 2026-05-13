from django.conf import settings
from django.db import models

from tours.models import TourShare


class SharedTourRating(models.Model):
    share = models.ForeignKey(TourShare, on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shared_tour_ratings",
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name="shared_tour_rating_between_one_and_five",
            ),
            models.UniqueConstraint(fields=["share", "user"], name="unique_shared_tour_user_rating"),
        ]
        ordering = ["-updated_at"]
