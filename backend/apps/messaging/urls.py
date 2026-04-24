from django.urls import path

from .views import ConversationListView, ConversationMessageListCreateView

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path(
        "conversations/<int:conversation_id>/messages/",
        ConversationMessageListCreateView.as_view(),
        name="conversation-message-list-create",
    ),
]

