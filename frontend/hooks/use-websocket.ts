"use client";

import { useEffect, useRef, useState } from "react";
import { connectWebSocket, RealtimeMessage } from "@/lib/websocket";

export type ConnectionState = "idle" | "connecting" | "open" | "closed" | "error";

type UseWebsocketOptions = {
  path: string;
  onMessage: (message: RealtimeMessage) => void;
  enabled?: boolean;
};

export function useWebsocket({ path, onMessage, enabled = true }: UseWebsocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionState>("idle");

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    const socket = connectWebSocket(path, {
      onOpen: () => setStatus("open"),
      onClose: () => setStatus("closed"),
      onError: () => setStatus("error"),
      onMessage
    });

    wsRef.current = socket;

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, path, onMessage]);

  return { status };
}
