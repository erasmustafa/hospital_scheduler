from django.conf import settings
from django.db import models

from common.mixins import TimestampMixin


class Notification(TimestampMixin):
    class EventType(models.TextChoices):
        ASSIGNMENT_UPDATE = "assignment_update", "Assignment Update"
        APPROVAL_REQUEST = "approval_request", "Approval Request"
        SYSTEM = "system", "System"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    event_type = models.CharField(max_length=40, choices=EventType.choices)
    title = models.CharField(max_length=120)
    message = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.recipient} - {self.title}"
