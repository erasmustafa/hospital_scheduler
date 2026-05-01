"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X, Building2, ClipboardList, Bell, FileText } from "lucide-react";
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
  const [shouldRender, setShouldRender] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const plannerRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hasPositionRef = useRef(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!shouldRender || !open || hasPositionRef.current || typeof window === "undefined") {
      return;
    }

    const updateInitialPosition = () => {
      const panelWidth = plannerRef.current?.offsetWidth ?? 400;
      const x = Math.max(16, window.innerWidth - panelWidth - 24);
      setPosition({ x, y: 24 });
      hasPositionRef.current = true;
    };

    updateInitialPosition();
  }, [open, shouldRender]);

  useEffect(() => {
    if (!isDragging || typeof window === "undefined") {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const panel = plannerRef.current;
      const panelWidth = panel?.offsetWidth ?? 400;
      const panelHeight = panel?.offsetHeight ?? 640;
      const nextX = event.clientX - dragOffsetRef.current.x;
      const nextY = event.clientY - dragOffsetRef.current.y;

      setPosition({
        x: Math.min(Math.max(16, nextX), Math.max(16, window.innerWidth - panelWidth - 16)),
        y: Math.min(Math.max(16, nextY), Math.max(16, window.innerHeight - panelHeight - 16)),
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const panel = plannerRef.current;
    if (!panel) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setIsDragging(true);
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-200 ease-in-out ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        ref={plannerRef}
        style={{
          left: position.x,
          top: position.y,
        }}
        className={`pointer-events-auto absolute w-[400px] max-w-[calc(100vw-32px)] origin-top-right rounded-[26px] border border-blue-100/80 bg-white/92 p-4 shadow-[0_30px_80px_-34px_rgba(15,23,42,0.42)] ring-1 ring-white/70 backdrop-blur-xl transition-all duration-200 ease-in-out ${
          animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.92] opacity-0 -translate-y-4'
        }`}
      >
        <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-white/75 via-blue-50/35 to-slate-100/55" />
        <div className="absolute inset-[1px] rounded-[25px] border border-white/70" />

        <div
          onPointerDown={handleDragStart}
          className={`relative flex items-center justify-between gap-3 rounded-[18px] border border-blue-100/70 bg-white/70 px-3 py-2.5 shadow-[0_12px_28px_-24px_rgba(37,99,235,0.55)] backdrop-blur ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                Mini Planner
              </p>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Günlük Ajanda
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#2a3c66] to-[#1a2542] text-white shadow-md">
          <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-sm">
                  <CalendarDays className="h-4 w-4 opacity-90" />
                </div>
                <div>
                  <h4 className="text-[15px] font-medium text-white">
                    {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>
                  <p className="text-[11px] text-slate-300">Timeline ve görev kartları</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectDate("2026-04-26")}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-white/10"
              >
                Bugün
              </button>
            </div>

            <div className="mt-4 flex justify-center gap-2.5">
              {[
                { d: "21", name: "Sal" },
                { d: "22", name: "Çar" },
                { d: "23", name: "Per" },
                { d: "24", name: "Cum" },
                { d: "25", name: "Cmt" },
                { d: "26", name: "Paz" },
                { d: "27", name: "Pzt" },
              ].map((day) => {
                const isActive = day.d === selectedDate.slice(-2);
                return (
                  <button
                    key={day.d}
                    type="button"
                    onClick={() => onSelectDate(`2026-04-${day.d}`)}
                    className={`flex h-12 w-10 flex-col items-center justify-center rounded-[12px] transition-all ${
                      isActive
                        ? "scale-105 bg-white text-blue-700 shadow-sm"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-[14px] font-semibold">{day.d}</span>
                    <span
                      className={`text-[10px] font-medium ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    >
                      {day.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative mt-4 space-y-3">
          <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                <Clock3 className="h-4 w-4 text-blue-500" />
                Günlük timeline
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
              >
                Tümünü Gör <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="relative mt-4">
              {/* Vertical line */}
              <div className="absolute bottom-2 left-[5px] top-2 w-[1.5px] rounded-full bg-slate-100"></div>

              <div className="space-y-4">
                {(todaysItems.length > 0 ? todaysItems : plannerItems.slice(0, 3)).map((item, idx) => (
                  <div key={item.id} className="relative flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="absolute left-[2px] top-1.5 z-10 h-2 w-2 rounded-full border border-white bg-blue-500 shadow-sm"></div>

                    <div className="w-[42px] shrink-0 pt-0.5 pl-4 text-[12px] font-semibold text-blue-600">
                      {new Date(item.start).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[12px] font-semibold text-slate-800 leading-tight">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.assignedTo ?? "Atanmadı"}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {idx === 0 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {idx === 1 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600">
                          <ClipboardList className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {idx === 2 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                          <Bell className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {idx > 2 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <ShiftMiniCard shift={shifts[0]} />
            <TaskMiniCard task={tasks[0]} />
            <ReminderMiniCard reminder={reminders[0]} />
          </div>
        </div>
      </div>
    </div>
  );
}
