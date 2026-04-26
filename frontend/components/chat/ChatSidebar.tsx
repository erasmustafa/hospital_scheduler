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

function SectionTitle({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </h2>
      {meta ? <span className="text-xs font-semibold text-slate-400">{meta}</span> : null}
    </div>
  );
}

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
    <aside className="hidden min-h-0 flex-col rounded-[28px] border border-slate-200 bg-white p-4 xl:flex">
      <label className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/60">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Kanallarda ara..."
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </label>

      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <section className="space-y-3">
          <SectionTitle title="Birimler" meta={String(departments.length)} />
          <DepartmentBadgeList
            departments={departments}
            activeDepartmentId={activeDepartmentId}
            onSelectDepartment={onSelectDepartment}
          />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Kanallar" meta={String(channels.length)} />
          <ChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={onSelectChannel}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            <Star className="h-3.5 w-3.5 text-blue-500" />
            Sabitlenenler
          </div>
          <div className="space-y-2">
            {pinnedChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{channel.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {channel.description ?? "Sabitlenen kanal"}
                  </p>
                </div>
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
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
