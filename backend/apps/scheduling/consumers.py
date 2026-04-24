from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ScheduleConsumer(AsyncJsonWebsocketConsumer):
    group_name = "schedule_global"

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        await self.send_json({"type": "ack", "payload": {"received": content}})

    async def broadcast_message(self, event):
        await self.send_json(
            {"type": event.get("event_type", "event"), "payload": event.get("payload", {})}
        )
