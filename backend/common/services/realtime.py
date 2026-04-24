from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def publish_event(group_name: str, event_type: str, payload: dict) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        group_name,
        {"type": "broadcast.message", "event_type": event_type, "payload": payload},
    )
