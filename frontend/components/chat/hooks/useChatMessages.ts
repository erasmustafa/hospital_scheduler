"use client";

import { useEffect, useMemo, useState } from "react";
import detectMessageIntent from "@/components/chat/utils/detectMessageIntent";
import parseSlashCommand from "@/components/chat/utils/parseSlashCommand";
import type { Message } from "@/types/chat";

const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-1",
    channelId: "ops-general",
    sender: {
      id: "u-1",
      name: "Dr. Elif Yılmaz",
      role: "Başhekim Yardımcısı",
      initials: "EY",
    },
    content: "Bugünkü yoğun bakım devir notlarını 10:00'a kadar paylaşalım.",
    createdAt: "2026-04-26T08:15:00",
    type: "text",
  },
  {
    id: "msg-2",
    channelId: "dept-er",
    departmentId: "er",
    sender: {
      id: "u-2",
      name: "Ahmet Soylu",
      role: "Acil Servis Sorumlusu",
      initials: "AS",
    },
    content: "Gece vardiyası için iki personel daha yedekte tutulacak.",
    createdAt: "2026-04-26T08:42:00",
    type: "shift",
    metadata: {
      shiftLabel: "Gece vardiyası",
      start: "16:00",
      end: "00:00",
      staffName: "Yedek ekip",
    },
  },
  {
    id: "msg-3",
    channelId: "dept-surgery",
    departmentId: "surgery",
    sender: {
      id: "u-3",
      name: "Merve Aksoy",
      role: "Operasyon Koordinatörü",
      initials: "MA",
    },
    content: "Cuma günü plan revizyonu onaylandı, karar olarak sabitleyelim.",
    createdAt: "2026-04-26T09:12:00",
    type: "decision",
    isPinned: true,
    metadata: {
      decisionOwner: "Merve Aksoy",
      decisionSummary: "Operasyon odası iki ekip ile çalışacak.",
    },
  },
  {
    id: "msg-4",
    channelId: "ops-general",
    sender: {
      id: "u-4",
      name: "Mustafa Bedir",
      role: "Birim Yetkilisi",
      initials: "MB",
    },
    content: "Elif izin talebini bugün içinde kontrol etmem gerekiyor.",
    createdAt: "2026-04-26T09:24:00",
    type: "task",
    metadata: {
      title: "İzin talebini kontrol et",
      assigneeName: "Mustafa Bedir",
      priority: "high",
      status: "in_progress",
    },
  },
  {
    id: "msg-5",
    channelId: "ops-general",
    sender: {
      id: "u-5",
      name: "Demet Çelik Gelen",
      role: "İdari İşler",
      initials: "DG",
    },
    content: "Toplantıdan 30 dakika önce tüm ekibe hatırlatma geçelim.",
    createdAt: "2026-04-26T09:40:00",
    type: "reminder",
    metadata: {
      remindAt: "2026-04-26T11:30:00",
      targetNames: ["Operasyon Ekibi"],
      priority: "normal",
    },
  },
];

type UseChatMessagesArgs = {
  channelId: string;
  activeDepartmentId: string | null;
};

export default function useChatMessages({
  channelId,
  activeDepartmentId,
}: UseChatMessagesArgs) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers] = useState<string[]>(["Ece Yılmaz"]);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => {
      setMessages(MOCK_MESSAGES);
      setIsLoading(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (message.channelId !== channelId) {
        return false;
      }
      if (!activeDepartmentId) {
        return true;
      }
      return !message.departmentId || message.departmentId === activeDepartmentId;
    });
  }, [activeDepartmentId, channelId, messages]);

  const sendMessage = (content: string) => {
    const slash = parseSlashCommand(content);
    const intent = slash.isCommand ? slash.command : detectMessageIntent(content);

    const nextMessage: Message = {
      id: `msg-${Date.now()}`,
      channelId,
      departmentId: activeDepartmentId ?? undefined,
      sender: {
        id: "current-user",
        name: "Mustafa Bedir",
        role: "Birim Yetkilisi",
        initials: "MB",
      },
      content: slash.isCommand && slash.args ? slash.args : content.trim(),
      createdAt: new Date().toISOString(),
      type:
        intent === "task" ||
        intent === "reminder" ||
        intent === "decision" ||
        intent === "shift"
          ? intent
          : "text",
      metadata: {
        slashCommand: slash.command,
      },
    };

    setMessages((current) => [...current, nextMessage]);
    return nextMessage;
  };

  const editMessage = (id: string, content: string) => {
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, content } : message))
    );
  };

  const deleteMessage = (id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  };

  const markAsRead = () => undefined;

  return {
    messages: filteredMessages,
    isLoading,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
  };
}
