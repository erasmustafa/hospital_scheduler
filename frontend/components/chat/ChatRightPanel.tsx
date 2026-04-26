import {
  BellRing,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Info,
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
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <button type="button" className="text-[11px] font-black text-blue-600">
        {link}
      </button>
    </div>
  );
}

function ShiftGridCard({ shift }: { shift: ShiftCardItem }) {
  const isNight = shift.shiftLabel.toLocaleLowerCase("tr-TR").includes("gece");
  const initials = shift.staffName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.2)]">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-[12px] font-black text-indigo-700">
          {initials}
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {isNight ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-[13px] font-bold leading-5 text-slate-900">
        {shift.staffName}
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        <Clock3 className="h-3.5 w-3.5" />
        {shift.start} - {shift.end}
      </div>
    </div>
  );
}

function ReminderGridCard({ reminder }: { reminder: Reminder }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.2)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-bold leading-5 text-slate-900">
            {reminder.title}
          </p>
          <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
            {(reminder.targetNames ?? []).join(", ") || "Hedef kisi yok"}
          </p>
        </div>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <BellRing className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
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
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.08em]">
          {reminder.repeat ?? "none"}
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
    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-slate-900">{task.title}</p>
          <p className="mt-1 text-[12px] font-medium text-slate-500">
            {task.assigneeName ?? "Atanmadi"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${priorityTone[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[12px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <LoaderCircle className="h-3.5 w-3.5" />
          {task.status.replace("_", " ")}
        </span>
        <span>{task.dueDate ? new Date(task.dueDate).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
      </div>
    </div>
  );
}

function DecisionRow({ decision }: { decision: PinnedDecision }) {
  return (
    <div className="rounded-[16px] border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">{decision.title}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600">
            {decision.summary}
          </p>
        </div>
        <Pin className="h-4 w-4 shrink-0 text-blue-600" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
          {decision.ownerName}
        </span>
        <span>{formatRelativeShort(decision.createdAt)}</span>
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const toneIcon = {
    info: <Info className="h-3.5 w-3.5 text-blue-600" />,
    success: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
    warning: <Clock3 className="h-3.5 w-3.5 text-amber-600" />,
  };

  return (
    <div className="flex items-start gap-2.5 rounded-[14px] border border-slate-200 bg-white px-3 py-2.5">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-50">
        {toneIcon[item.tone ?? "info"]}
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-slate-900">{item.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">
          {item.description}
        </p>
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
    <aside className="hidden min-h-0 overflow-y-auto rounded-[28px] border border-slate-200 bg-[#F8FAFD] p-3 xl:block">
      <div className="space-y-4">
        <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
          <SectionHeader title="Bugunku Vardiyalar" link="Tumunu Gor" />
          <div className="grid grid-cols-2 gap-2.5">
            {shifts.slice(0, 4).map((shift) => (
              <ShiftGridCard key={shift.id} shift={shift} />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
          <SectionHeader title="Yaklasan Hatirlaticilar" link="Tumunu Gor" />
          <div className="grid grid-cols-2 gap-2.5">
            {reminders.slice(0, 4).map((reminder) => (
              <ReminderGridCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
          <SectionHeader title="Acik Gorevler" link="Tum Gorevler" />
          <div className="space-y-2.5">
            {tasks.slice(0, 2).map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
          <SectionHeader title="Sabitlenen Kararlar" link="Tumunu Gor" />
          <div className="space-y-2.5">
            {decisions.slice(0, 2).map((decision) => (
              <DecisionRow key={decision.id} decision={decision} />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
          <SectionHeader title="Son Aktiviteler" link="Tumunu Gor" />
          <div className="space-y-2">
            {activities.slice(0, 3).map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
