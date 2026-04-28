import {
  BellRing,
  CheckCheck,
  Clock3,
  LoaderCircle,
  MoonStar,
  Pin,
  SunMedium,
} from "lucide-react";
import { formatRelativeShort } from "@/components/chat/utils/messageFormatters";
import type { ActivityItem, PinnedDecision, ShiftCardItem } from "@/types/chat";
import type { Reminder } from "@/types/reminder";
import type { Task } from "@/types/task";

type ChatRightPanelProps = {
  shifts: ShiftCardItem[];
  reminders: Reminder[];
  tasks: Task[];
  decisions: PinnedDecision[];
  activities: ActivityItem[];
};

function SectionHeader({
  title,
  link,
}: {
  title: string;
  link: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-[13px] font-semibold text-slate-950">{title}</h3>
      <button type="button" className="text-[10px] font-semibold text-blue-600">
        {link}
      </button>
    </div>
  );
}

function ShiftGridCard({ shift }: { shift: ShiftCardItem }) {
  const isNight = shift.shiftLabel.toLocaleLowerCase("tr-TR").includes("gece");

  return (
    <div className="rounded-[16px] border border-slate-200 bg-white px-2.5 py-2.5 text-center shadow-[0_10px_24px_-22px_rgba(15,23,42,0.18)]">
      <div className="flex justify-center">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {isNight ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-4 text-slate-900">
        {shift.staffName}
      </p>
      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
        <Clock3 className="h-3 w-3" />
        {shift.start} - {shift.end}
      </div>
    </div>
  );
}

function ReminderGridCard({ reminder }: { reminder: Reminder }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white px-2.5 py-2.5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[12px] font-semibold leading-4 text-slate-900">
            {reminder.title}
          </p>
          <p className="mt-1 truncate text-[10px] font-medium text-slate-500">
            {(reminder.targetNames ?? []).join(", ") || "Hedef kişi yok"}
          </p>
        </div>
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <BellRing className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
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
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const priorityTone: Record<Task["priority"], string> = {
    low: "bg-slate-100 text-slate-600",
    normal: "bg-blue-50 text-blue-700",
    high: "bg-amber-50 text-amber-700",
    critical: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-900">{task.title}</p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
            {task.assigneeName ?? "Atanmadı"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${priorityTone[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <LoaderCircle className="h-3 w-3" />
          {task.status.replace("_", " ")}
        </span>
        <span>{task.dueDate ? new Date(task.dueDate).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
      </div>
    </div>
  );
}

function DecisionRow({ decision }: { decision: PinnedDecision }) {
  return (
    <div className="rounded-[15px] border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-slate-900">{decision.title}</p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-600">
            {decision.summary}
          </p>
        </div>
        <Pin className="h-3.5 w-3.5 shrink-0 text-blue-600" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CheckCheck className="h-3 w-3 text-emerald-600" />
          {decision.ownerName}
        </span>
        <span>{formatRelativeShort(decision.createdAt)}</span>
      </div>
    </div>
  );
}

export default function ChatRightPanel({
  shifts,
  reminders,
  tasks,
  decisions,
  activities,
}: ChatRightPanelProps) {
  return (
    <aside className="hidden min-h-0 overflow-y-auto rounded-[26px] border border-slate-200 bg-[#F8FAFD] p-2 xl:block">
      <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
        <section>
          <SectionHeader title="Bugünkü Vardiyalar" link="Tümünü Gör" />
          <div className="grid grid-cols-2 gap-2">
            {shifts.slice(0, 4).map((shift) => (
              <ShiftGridCard key={shift.id} shift={shift} />
            ))}
          </div>
        </section>

        <section className="mt-4 border-t border-slate-100 pt-4">
          <SectionHeader title="Yaklaşan Hatırlatıcılar" link="Tümünü Gör" />
          <div className="space-y-2">
            {reminders.slice(0, 2).map((reminder) => (
              <ReminderGridCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>

        <section className="mt-4 border-t border-slate-100 pt-4">
          <SectionHeader title="Açık Görevler" link="Tüm Görevler" />
          <div className="space-y-2">
            {tasks.slice(0, 2).map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </section>

        <section className="mt-4 border-t border-slate-100 pt-4">
          <SectionHeader title="Sabitlenen Kararlar" link="Tümünü Gör" />
          <div className="space-y-2">
            {decisions.slice(0, 2).map((decision) => (
              <DecisionRow key={decision.id} decision={decision} />
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
