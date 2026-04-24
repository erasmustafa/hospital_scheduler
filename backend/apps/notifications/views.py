from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.services import publish_event

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({"notifications": response.data}, status=response.status_code)


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk: int):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])

        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        publish_event(
            f"notifications_{request.user.id}",
            "notification.read",
            {"id": notification.id, "unreadCount": unread_count},
        )

        return Response(
            {"notification": NotificationSerializer(notification).data, "unreadCount": unread_count},
            status=status.HTTP_200_OK,
        )
