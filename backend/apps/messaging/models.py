from django.conf import settings
from django.db import models


User = settings.AUTH_USER_MODEL


class Conversation(models.Model):
    CONVERSATION_TYPES = [
        ("direct", "Direct"),
        ("group", "Group"),
        ("channel", "Channel"),
    ]

    name = models.CharField(max_length=255, blank=True)
    conversation_type = models.CharField(max_length=20, choices=CONVERSATION_TYPES)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name or f"{self.conversation_type} chat"


class ConversationMember(models.Model):
    ROLE_CHOICES = [
        ("member", "Member"),
        ("admin", "Admin"),
        ("owner", "Owner"),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="members",
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("conversation", "user")

    def __str__(self):
        return f"{self.user} in {self.conversation}"


class Message(models.Model):
    MESSAGE_TYPES = [
        ("text", "Text"),
        ("system", "System"),
        ("announcement", "Announcement"),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_messages",
    )
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default="text")
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender} -> {self.conversation}"


class Notification(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="messaging_notifications",
    )
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Notification for {self.user}"

