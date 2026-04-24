from django.urls import path

from apps.messaging.consumers import MessagingConsumer
from apps.notifications.consumers import NotificationConsumer
from apps.scheduling.consumers import ScheduleConsumer

websocket_urlpatterns = [
    path("ws/schedule/", ScheduleConsumer.as_asgi()),
    path("ws/notifications/", NotificationConsumer.as_asgi()),
    path("ws/messages/", MessagingConsumer.as_asgi()),
]
