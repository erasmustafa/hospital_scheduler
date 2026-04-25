"use client";

import { CalendarDays, ChevronLeft, Clock3, X } from "lucide-react";
import ShiftMiniCard from "@/components/chat/cards/ShiftMiniCard";
import TaskMiniCard from "@/components/chat/cards/TaskMiniCard";
import ReminderMiniCard from "@/components/chat/cards/ReminderMiniCard";
import type { PlannerItem, ShiftCardItem } from "@/types/chat";
import type { Department } from "@/types/department";
import type { Reminder } from "@/types/reminder";
import type { Task } from "@/types/task";

type FloatingPlannerProps = {
  open: boolean;
  selectedDate: string;
  onSelectDate: (value: string) => void;
  onClose: () => void;
  plannerItems: PlannerItem[];
  todaysItems: PlannerItem[];
  shifts: ShiftCardItem[];
  tasks: Task[];
  reminders: Reminder[];
  departments: Department[];
};

export default function FloatingPlanner({
  open,
  selectedDate,
  onSelectDate,
  onClose,
  plannerItems,
  todaysItems,
  shifts,
  tasks,
  reminders,
}: FloatingPlannerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-start justify-end p-6">
      <div className="pointer-events-auto w-full max-w-md rounded-[28px] border border-blue-100 bg-white/90 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500">
              Mini Planner
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
              Günlük Ajanda
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-xs text-blue-100">Timeline ve görev kartları</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectDate("2026-04-26")}
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/90"
            >
              Bugün
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {["21", "22", "23", "24", "25", "26", "27"].map((day) => {
              const isActive = day === selectedDate.slice(-2);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDate(`2026-04-${day}`)}
                  className={`rounded-2xl px-0 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-white text-blue-700" : "bg-white/10 text-white/80"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock3 className="h-4 w-4 text-blue-600" />
              Günlük timeline
            </div>
            <div className="mt-4 space-y-3">
              {todaysItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm"
                >
                  <div className="w-16 shrink-0 text-xs font-bold text-slate-500">
                    {new Date(item.start).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.assignedTo ?? "Atanmadı"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <ShiftMiniCard shift={shifts[0]} />
            <TaskMiniCard task={tasks[0]} />
            <ReminderMiniCard reminder={reminders[0]} />
          </div>
        </div>
      </div>
    </div>
  );
}
