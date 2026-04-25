import { BellPlus, CalendarRange, Search, Sparkles } from "lucide-react";
import type { Channel } from "@/types/chat";
import type { Department } from "@/types/department";

type ChatHeaderProps = {
  activeChannel: Channel | null;
  activeDepartment: Department | null;
  onOpenPlanner: () => void;
  onOpenReminder: () => void;
  onOpenCommandPalette: () => void;
};

export default function ChatHeader({
  activeChannel,
  activeDepartment,
  onOpenPlanner,
  onOpenReminder,
  onOpenCommandPalette,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
              {activeChannel?.name ?? "Kanal seçin"}
            </h2>
            {activeDepartment ? (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeDepartment.color}`}>
                {activeDepartment.name}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {activeChannel?.description ??
              "Context-aware operasyon mesajları, görev dönüşümleri ve planner aksiyonları burada."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 lg:flex">
            <Search className="h-4 w-4" />
            Sohbette ara
          </div>
          <button
            type="button"
            onClick={onOpenReminder}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <BellPlus className="h-4 w-4 text-blue-600" />
            Hatırlatıcı
          </button>
          <button
            type="button"
            onClick={onOpenPlanner}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <CalendarRange className="h-4 w-4 text-blue-600" />
            Ajanda
          </button>
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/80"
          >
            <Sparkles className="h-4 w-4" />
            Komutlar
          </button>
        </div>
      </div>
    </header>
  );
}
