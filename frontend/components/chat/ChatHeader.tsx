import {
  BellPlus,
  CalendarRange,
  MoreVertical,
  Search,
  Sparkles,
  Star,
  UserPlus,
} from "lucide-react";
import type { Channel } from "@/types/chat";
import type { Department } from "@/types/department";

type ChatHeaderProps = {
  activeChannel: Channel | null;
  activeDepartment: Department | null;
  onOpenPlanner: () => void;
  onOpenReminder: () => void;
  onOpenCommandPalette: () => void;
};

function HeaderButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/60 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
    >
      <span className="text-blue-600">{icon}</span>
      {label}
    </button>
  );
}

export default function ChatHeader({
  activeChannel,
  activeDepartment,
  onOpenPlanner,
  onOpenReminder,
  onOpenCommandPalette,
}: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-[30px] font-black tracking-[-0.03em] text-slate-950">
            {activeChannel?.name ?? "Kanal secin"}
          </h2>
          <Star className="h-4 w-4 shrink-0 text-slate-400" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          {activeDepartment ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {activeDepartment.name}
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {activeChannel?.onlineCount ?? activeChannel?.memberCount ?? 0} cevrimici
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm shadow-slate-200/60 lg:flex">
          <Search className="h-4 w-4" />
          Sohbette ara...
        </div>
        <HeaderButton icon={<CalendarRange className="h-4 w-4" />} label="Ajanda" onClick={onOpenPlanner} />
        <HeaderButton icon={<BellPlus className="h-4 w-4" />} label="Hatirlatici" onClick={onOpenReminder} />
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.6)] transition hover:bg-blue-700"
        >
          <Sparkles className="h-4 w-4" />
          Komutlar
        </button>
        <button
          type="button"
          className="rounded-2xl p-2 text-blue-600 transition hover:bg-blue-50"
          aria-label="Katilimci ekle"
        >
          <UserPlus className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100"
          aria-label="Daha fazla"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
