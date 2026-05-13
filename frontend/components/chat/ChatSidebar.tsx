import { MessageSquareText, Search } from "lucide-react";
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

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
      {title}
    </h2>
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
    <aside className="hidden min-h-0 flex-col bg-white px-4 py-5 xl:flex">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-indigo-50 to-violet-50 text-blue-600 shadow-sm">
          <MessageSquareText className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-bold tracking-[-0.02em] text-slate-950">
            Klinik İletişim
          </h1>
          <p className="mt-1 truncate text-[12px] font-medium text-slate-500">
            Ekip içi anlık iletişim platformu
          </p>
        </div>
      </div>

      <label className="flex h-11 items-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.24)]">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Kanallarda ara..."
          className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
        />
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
          ⌘ K
        </span>
      </label>

      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
        <section className="space-y-3">
          <SectionTitle title="Birimler" />
          <DepartmentBadgeList
            departments={departments}
            activeDepartmentId={activeDepartmentId}
            onSelectDepartment={onSelectDepartment}
          />
        </section>

        <section className="space-y-3">
          <SectionTitle title="Kanallar" />
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
