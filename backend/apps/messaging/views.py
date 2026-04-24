from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, ConversationMember, Message


def _serialize_message(message: Message):
    return {
        "id": message.id,
        "content": message.content,
        "messageType": message.message_type,
        "createdAt": message.created_at.isoformat(),
        "editedAt": message.edited_at.isoformat() if message.edited_at else None,
        "isDeleted": message.is_deleted,
        "sender": {
            "id": message.sender_id,
            "username": message.sender.username if message.sender else None,
        },
    }


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = (
            Conversation.objects.filter(members__user=request.user, is_active=True)
            .distinct()
            .order_by("-created_at")
        )

        payload = []
        for conversation in conversations:
            last_message = (
                conversation.messages.filter(is_deleted=False)
                .select_related("sender")
                .order_by("-created_at")
                .first()
            )
            payload.append(
                {
                    "id": conversation.id,
                    "name": conversation.name,
                    "conversationType": conversation.conversation_type,
                    "createdAt": conversation.created_at.isoformat(),
                    "memberCount": conversation.members.count(),
                    "lastMessage": _serialize_message(last_message) if last_message else None,
                }
            )

        return Response({"conversations": payload}, status=status.HTTP_200_OK)


class ConversationMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_conversation(self, request, conversation_id):
        if not ConversationMember.objects.filter(
            conversation_id=conversation_id,
            user=request.user,
        ).exists():
            return None

        try:
            return Conversation.objects.get(pk=conversation_id, is_active=True)
        except Conversation.DoesNotExist:
            return None

    def get(self, request, conversation_id: int):
        conversation = self._get_conversation(request, conversation_id)
        if not conversation:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        messages = (
            Message.objects.filter(conversation=conversation)
            .select_related("sender")
            .order_by("-created_at")[:100]
        )
        payload = [_serialize_message(item) for item in reversed(messages)]
        return Response({"messages": payload}, status=status.HTTP_200_OK)

    def post(self, request, conversation_id: int):
        conversation = self._get_conversation(request, conversation_id)
        if not conversation:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)

        content = str((request.data or {}).get("content", "")).strip()
        if not content:
            return Response({"detail": "content is required."}, status=status.HTTP_400_BAD_REQUEST)

        message_type = str((request.data or {}).get("messageType", "text")).strip() or "text"
        allowed_types = {choice[0] for choice in Message.MESSAGE_TYPES}
        if message_type not in allowed_types:
            return Response({"detail": "Invalid messageType."}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            message_type=message_type,
        )
        return Response({"message": _serialize_message(message)}, status=status.HTTP_201_CREATED)

