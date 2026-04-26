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

function HeaderIconButton({
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
      aria-label={label}
      title={label}
      className="group relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-200/60 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
    >
      {icon}
      <span className="pointer-events-none absolute -bottom-10 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-600 opacity-0 shadow-lg shadow-slate-200/70 transition group-hover:opacity-100">
        {label}
      </span>
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
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-[24px] font-black tracking-[-0.03em] text-slate-950">
            {activeChannel?.name ?? "Kanal secin"}
          </h2>
          <Star className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
          {activeDepartment ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {activeDepartment.name}
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium">
              {activeChannel?.onlineCount ?? activeChannel?.memberCount ?? 0} cevrimici
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <HeaderIconButton icon={<Search className="h-4 w-4" />} label="Sohbette ara" />
        <HeaderIconButton
          icon={<BellPlus className="h-4 w-4" />}
          label="Hatirlatici"
          onClick={onOpenReminder}
        />
        <HeaderIconButton
          icon={<CalendarRange className="h-4 w-4" />}
          label="Ajanda"
          onClick={onOpenPlanner}
        />
        <HeaderIconButton
          icon={<Sparkles className="h-4 w-4" />}
          label="Komutlar"
          onClick={onOpenCommandPalette}
        />
        <button
          type="button"
          className="rounded-2xl p-2 text-blue-600 transition hover:bg-blue-50"
          aria-label="Katilimci ekle"
        >
          <UserPlus className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100"
          aria-label="Daha fazla"
        >
          <MoreVertical className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
