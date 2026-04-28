import { Bell, BellRing, CalendarDays, Repeat2 } from "lucide-react";
import type { Reminder } from "@/types/reminder";

type ReminderMiniCardProps = {
  reminder: Reminder;
};

export default function ReminderMiniCard({ reminder }: ReminderMiniCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
        <Bell className="h-4 w-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h4 className="truncate text-[13px] font-semibold text-slate-800">{reminder.title}</h4>
            <p className="truncate text-[11px] text-slate-500">
              {(reminder.targetNames ?? []).join(", ") || "Hedef kişi yok"}
            </p>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
            <BellRing className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
          <div className="flex items-center gap-1 text-slate-500">
            <CalendarDays className="h-3 w-3" />
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
          </div>
          <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-slate-600">
            <Repeat2 className="h-3 w-3" />
            {reminder.repeat ?? "none"}
          </span>
        </div>
      </div>
    </div>
  );
}
