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
  return <Hash className="h-3.5 w-3.5" />;
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
            className={`flex w-full items-center gap-2.5 rounded-2xl border px-2 py-1.5 text-left transition ${
              active
                ? "border-blue-200 bg-blue-600 text-white shadow-[0_18px_40px_-26px_rgba(37,99,235,0.55)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-100 hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {channelIcon(channel.type)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-[13px] font-semibold italic leading-5">
                  {channel.name}
                </span>
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
