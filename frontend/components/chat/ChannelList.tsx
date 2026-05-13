import { Hash, Lock, Radio } from "lucide-react";
import type { Channel } from "@/types/chat";

type ChannelListProps = {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
};

function channelIcon(type: Channel["type"]) {
  if (type === "private") return <Lock className="h-3.5 w-3.5" />;
  if (type === "system") return <Radio className="h-3.5 w-3.5" />;
  return <Hash className="h-4 w-4" />;
}

function formatChannelName(name: string) {
  return name.replace(/\s+kanalı$/i, "").trim();
}

export default function ChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
}: ChannelListProps) {
  return (
    <div className="space-y-1.5">
      {channels.map((channel) => {
        const active = channel.id === activeChannelId;

        return (
          <button
            key={channel.id}
            type="button"
            onClick={() => onSelectChannel(channel.id)}
            className={`flex w-full items-center gap-2.5 rounded-[13px] border px-3 py-2 text-left transition duration-200 active:scale-[0.985] ${
              active
                ? "border-blue-500 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_16px_34px_-24px_rgba(79,70,229,0.75)]"
                : "border-transparent bg-white text-slate-700 hover:border-blue-100 hover:bg-blue-50/70 hover:shadow-sm"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-2 truncate text-[13px] font-semibold leading-5">
                  <span className={active ? "text-white" : "text-slate-500"}>
                    {channelIcon(channel.type)}
                  </span>
                  <span className="truncate">{formatChannelName(channel.name)}</span>
                </span>
                {channel.unreadCount > 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active ? "bg-white/90 text-blue-700" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {channel.unreadCount}
                  </span>
                ) : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
