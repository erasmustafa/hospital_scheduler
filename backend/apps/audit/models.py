from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTIONS = [
        ("login", "Login"),
        ("logout", "Logout"),
        ("request", "Request"),
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("export", "Export"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=20)
    entity = models.CharField(max_length=255)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        actor = self.actor.username if self.actor else "anonymous"
        return f"{actor} - {self.action} - {self.entity}"

    # Legacy accessors for backup compatibility (apps/audit from backup project).
    @property
    def user(self):
        return self.actor

    @property
    def action_type(self):
        return self.action

    @property
    def path(self):
        return self.entity

    @property
    def method(self):
        return str((self.payload or {}).get("method", ""))

    @property
    def ip_address(self):
        return (self.payload or {}).get("ipAddress")
