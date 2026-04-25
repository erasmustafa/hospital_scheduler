import { Search, Star } from "lucide-react";
import ChannelList from "@/components/chat/ChannelList";
import DepartmentBadgeList from "@/components/chat/DepartmentBadgeList";
import type { Channel } from "@/types/chat";
import type { Department } from "@/types/department";

type ChatSidebarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  departments: Department[];
  activeDepartmentId: string | null;
  onSelectDepartment: (id: string | null) => void;
  pinnedChannels: Channel[];
};

export default function ChatSidebar({
  search,
  onSearchChange,
  channels,
  activeChannelId,
  onSelectChannel,
  departments,
  activeDepartmentId,
  onSelectDepartment,
  pinnedChannels,
}: ChatSidebarProps) {
  return (
    <aside className="hidden h-full min-h-0 flex-col border-r border-slate-200 bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white xl:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200/70">
          Context-Aware Chat
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Kurumsal İletişim</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Birim bazlı kanallar, görev akışı ve mini planner aynı ekranda.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
        <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Kanallarda ara"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Kanallar
            </h2>
            <span className="text-xs font-semibold text-slate-500">{channels.length}</span>
          </div>
          <ChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={onSelectChannel}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Birimler
          </h2>
          <DepartmentBadgeList
            departments={departments}
            activeDepartmentId={activeDepartmentId}
            onSelectDepartment={onSelectDepartment}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            <Star className="h-3.5 w-3.5" />
            Sabitlenenler
          </div>
          <div className="space-y-2">
            {pinnedChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/10"
              >
                <span className="truncate">{channel.name}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-blue-200">
                  {channel.unreadCount}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
