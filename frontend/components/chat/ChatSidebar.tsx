import { Search } from "lucide-react";
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
}: ChatSidebarProps) {
  return (
    <aside className="hidden min-h-0 flex-col rounded-[28px] border border-slate-200 bg-white p-3.5 xl:flex">
      <label className="flex h-8 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm shadow-slate-200/60">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Kanallarda ara..."
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </label>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <section className="space-y-2">
          <SectionTitle title="Birimler" meta={String(departments.length)} />
          <DepartmentBadgeList
            departments={departments}
            activeDepartmentId={activeDepartmentId}
            onSelectDepartment={onSelectDepartment}
          />
        </section>

        <section className="space-y-2">
          <SectionTitle title="Kanallar" meta={String(channels.length)} />
          <ChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={onSelectChannel}
          />
        </section>

      </div>
    </aside>
  );
}
