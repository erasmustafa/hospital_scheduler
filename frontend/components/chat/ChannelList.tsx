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

function formatChannelName(name: string) {
  return name.replace(/\s+kanal[ıi]$/i, "").trim();
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
            className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
              active
                ? "border-blue-200 bg-blue-600 text-white shadow-[0_18px_40px_-26px_rgba(37,99,235,0.55)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-100 hover:bg-slate-50"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-2 truncate text-[14px] font-semibold italic leading-6">
                  <span className={`${active ? "text-white" : "text-slate-500"}`}>
                    {channelIcon(channel.type)}
                  </span>
                  <span className="truncate">
                    {formatChannelName(channel.name)}
                  </span>
                </span>
                {channel.unreadCount > 0 ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-black ${
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
