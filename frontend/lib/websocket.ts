const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";

export type RealtimeMessage = {
  type: string;
  payload: Record<string, unknown>;
};

type Handlers = {
  onMessage: (message: RealtimeMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
};

export function connectWebSocket(path: string, handlers: Handlers) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const socket = new WebSocket(`${WS_BASE_URL}${normalized}`);

  socket.onopen = () => handlers.onOpen?.();
  socket.onerror = (event) => handlers.onError?.(event);
  socket.onclose = () => handlers.onClose?.();
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as RealtimeMessage;
      handlers.onMessage(data);
    } catch {
      // Ignore malformed payloads.
    }
  };

  return socket;
}
