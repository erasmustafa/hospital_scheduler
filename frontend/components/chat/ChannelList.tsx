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
            className={`group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
              active
                ? "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm shadow-blue-100"
                : "border-transparent bg-white/70 hover:border-slate-200 hover:bg-white"
            }`}
          >
            <div
              className={`mt-0.5 rounded-xl p-2 ${
                active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {channelIcon(channel.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">{channel.name}</p>
                {channel.unreadCount > 0 ? (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    {channel.unreadCount}
                  </span>
                ) : null}
              </div>
              {channel.description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {channel.description}
                </p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
