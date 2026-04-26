import { Hash, Lock, Radio } from "lucide-react";
import type { Channel } from "@/types/chat";

type ChannelListProps = {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
};

function channelIcon(type: Channel["type"]) {
  if (type === "private") return <Lock className="h-4 w-4" />;
  if (type === "system") return <Radio className="h-4 w-4" />;
  return <Hash className="h-4 w-4" />;
}

export default function ChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
}: ChannelListProps) {
  return (
    <div className="space-y-2">
      {channels.map((channel) => {
        const active = channel.id === activeChannelId;

        return (
          <button
            key={channel.id}
            type="button"
            onClick={() => onSelectChannel(channel.id)}
            className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
              active
                ? "border-blue-200 bg-blue-600 text-white shadow-[0_18px_40px_-26px_rgba(37,99,235,0.55)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-100 hover:bg-slate-50"
            }`}
          >
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {channelIcon(channel.type)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-bold">{channel.name}</span>
                {channel.unreadCount > 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                      active ? "bg-white text-blue-700" : "bg-blue-600 text-white"
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
