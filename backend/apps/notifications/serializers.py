from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    eventType = serializers.CharField(source="event_type")
    isRead = serializers.BooleanField(source="is_read")

    class Meta:
        model = Notification
        fields = [
            "id",
            "eventType",
            "title",
            "message",
            "metadata",
            "isRead",
            "created_at",
        ]
