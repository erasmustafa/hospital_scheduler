import type { ReactNode } from "react";
import { AlarmClockCheck, CircleDashed, LoaderCircle, ShieldAlert, History } from "lucide-react";
import type { Task } from "@/types/task";

type TaskMiniCardProps = {
  task: Task;
};

const priorityTone: Record<Task["priority"], string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
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
    <div className="flex items-center gap-3 rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        <History className="h-4 w-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h4 className="truncate text-[13px] font-semibold text-slate-800">{task.title}</h4>
            <p className="truncate text-[11px] text-slate-500">
              {task.assigneeName ?? "Atanmadı"}
            </p>
          </div>
          <span
            className={`mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              priorityTone[task.priority]
            }`}
          >
            {task.priority}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
          <span className="flex items-center gap-1 text-slate-500">
            {statusIcon[task.status]}
            {task.status.replace("_", " ")}
          </span>
          {task.dueDate ? (
            <span className="text-slate-600">
              {new Date(task.dueDate).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
