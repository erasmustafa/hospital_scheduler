import { BellRing, Repeat2 } from "lucide-react";
import type { Reminder } from "@/types/reminder";

type ReminderMiniCardProps = {
  reminder: Reminder;
};

export default function ReminderMiniCard({ reminder }: ReminderMiniCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{reminder.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {(reminder.targetNames ?? []).join(", ") || "Hedef kişi yok"}
          </p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
          <BellRing className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          {new Date(reminder.remindAt).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
          })}{" "}
          {new Date(reminder.remindAt).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
          <Repeat2 className="h-3.5 w-3.5" />
          {reminder.repeat ?? "none"}
        </span>
      </div>
    </div>
  );
}
