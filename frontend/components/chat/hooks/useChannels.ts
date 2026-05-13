"use client";

import { useEffect, useMemo, useState } from "react";
import type { Channel } from "@/types/chat";

const MOCK_CHANNELS: Channel[] = [
  {
    id: "ops-general",
    name: "Genel operasyon",
    type: "general",
    unreadCount: 4,
    description: "Günlük kurum içi koordinasyon",
    memberCount: 32,
    onlineCount: 18,
  },
  {
    id: "dept-surgery",
    name: "Ameliyathane kanalı",
    type: "department",
    departmentId: "surgery",
    unreadCount: 2,
    description: "Operasyon salonu ve vaka hazırlıkları",
    memberCount: 14,
    onlineCount: 8,
  },
  {
    id: "dept-icu",
    name: "Yoğun Bakım kanalı",
    type: "department",
    departmentId: "icu",
    unreadCount: 0,
    description: "Kritik hasta ve yoğun bakım handoff",
    memberCount: 10,
    onlineCount: 6,
  },
  {
    id: "dept-er",
    name: "Acil Servis kanalı",
    type: "department",
    departmentId: "er",
    unreadCount: 7,
    description: "Acil vaka akışı ve kaynak paylaşımı",
    memberCount: 18,
    onlineCount: 11,
  },
  {
    id: "private-managers",
    name: "Vardiya Liderleri",
    type: "private",
    unreadCount: 1,
    description: "Yetkili kullanıcılar için kapalı kanal",
    memberCount: 5,
    onlineCount: 3,
  },
];

type UseChannelsArgs = {
  activeDepartmentId: string | null;
};

export default function useChannels({ activeDepartmentId }: UseChannelsArgs) {
  const filteredChannels = useMemo(() => {
    if (!activeDepartmentId) {
      return MOCK_CHANNELS;
    }
    return MOCK_CHANNELS.filter(
      (channel) =>
        channel.type === "general" ||
        channel.departmentId === activeDepartmentId ||
        channel.type === "private"
    );
  }, [activeDepartmentId]);

  const [activeChannelId, setActiveChannelId] = useState<string>(filteredChannels[0]?.id ?? "");

  useEffect(() => {
    if (!filteredChannels.some((channel) => channel.id === activeChannelId)) {
      setActiveChannelId(filteredChannels[0]?.id ?? "");
    }
  }, [activeChannelId, filteredChannels]);

  const activeChannel = useMemo(
    () => filteredChannels.find((channel) => channel.id === activeChannelId) ?? null,
    [activeChannelId, filteredChannels]
  );

  const pinnedChannels = useMemo(
    () => filteredChannels.filter((channel) => channel.unreadCount > 0).slice(0, 3),
    [filteredChannels]
  );

  return {
    channels: filteredChannels,
    activeChannel,
    activeChannelId,
    setActiveChannelId,
    pinnedChannels,
  };
}
