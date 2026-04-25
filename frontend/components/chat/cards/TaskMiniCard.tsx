import type { ReactNode } from "react";
import { AlarmClockCheck, CircleDashed, LoaderCircle, ShieldAlert } from "lucide-react";
import type { Task } from "@/types/task";

type TaskMiniCardProps = {
  task: Task;
};

const priorityTone: Record<Task["priority"], string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-rose-50 text-rose-700",
};

const statusIcon: Record<Task["status"], ReactNode> = {
  todo: <CircleDashed className="h-4 w-4" />,
  in_progress: <LoaderCircle className="h-4 w-4" />,
  done: <AlarmClockCheck className="h-4 w-4" />,
  cancelled: <ShieldAlert className="h-4 w-4" />,
};

export default function TaskMiniCard({ task }: TaskMiniCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
          <p className="mt-1 text-xs text-slate-500">{task.assigneeName ?? "Atanmadı"}</p>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${priorityTone[task.priority]}`}>
          {task.priority}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          {statusIcon[task.status]}
          {task.status.replace("_", " ")}
        </span>
        {task.dueDate ? (
          <span>{new Date(task.dueDate).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
        ) : null}
      </div>
    </div>
  );
}
