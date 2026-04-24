"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

export type AvailabilityDayState = {
  tone: "assignment" | "leave" | "preferred" | "pending";
  title: string;
  note?: string;
};

type DayCell = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

type AvailabilityMonthBoardProps = {
  selectedDates: string[];
  dayStateMap: Map<string, AvailabilityDayState>;
  onDateToggle: (dateStr: string) => void;
};

const dayLabels = ["Pzt", "Sal", "Car", "Per", "Cum", "Cmt", "Paz"];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthTitle(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  })
    .format(new Date(year, monthIndex, 1))
    .replace(/^./, (char) => char.toUpperCase());
}

function getMonthGrid(year: number, monthIndex: number): DayCell[] {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  const mondayBasedStart = startDay === 0 ? 6 : startDay - 1;
  const totalVisibleCells = Math.ceil((mondayBasedStart + daysInMonth) / 7) * 7;

  const gridStart = new Date(year, monthIndex, 1 - mondayBasedStart);
  const cells: DayCell[] = [];
  const today = new Date();

  for (let index = 0; index < totalVisibleCells; index += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);

    cells.push({
      date: toIsoDate(current),
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === monthIndex,
      isToday: isSameDate(current, today),
    });
  }

  return cells;
}

export function AvailabilityMonthBoard({
  selectedDates,
  dayStateMap,
  onDateToggle,
}: AvailabilityMonthBoardProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const monthGrid = useMemo(() => getMonthGrid(year, monthIndex), [year, monthIndex]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#346ce8]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[20px] font-extrabold tracking-[-0.03em] text-[#1e3552]">
              {getMonthTitle(year, monthIndex)}
            </div>
            <div className="text-xs font-semibold text-[#71839a]">
              Takvimden gün seçerek talep oluştur.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
            }}
            className="rounded-xl border border-[#d9e4f0] bg-[#f8fbff] px-3 py-2 text-sm font-bold text-[#346ce8] transition hover:bg-[#eef5ff]"
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(year, monthIndex - 1, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9e4f0] bg-[#edf4ff] text-[#346ce8] transition hover:bg-[#dce9ff]"
            aria-label="Onceki ay"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(year, monthIndex + 1, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9e4f0] bg-[#edf4ff] text-[#346ce8] transition hover:bg-[#dce9ff]"
            aria-label="Sonraki ay"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[24px] border border-[#deE7f2] bg-white">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-7 border-b border-[#e7eef5] bg-[#f7fbff]">
            {dayLabels.map((label) => (
              <div
                key={label}
                className="border-r border-[#e7eef5] px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#7a8ca2] last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-7">
              {monthGrid.map((cell) => {
                const state = dayStateMap.get(cell.date);
                const isSelected = selectedDates.includes(cell.date);

                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => onDateToggle(cell.date)}
                    className={cn(
                      "min-h-[132px] border-r border-b border-[#e7eef5] p-2.5 text-left transition last:border-r-0 md:min-h-[128px]",
                      !cell.isCurrentMonth && "bg-[#f8fafc]",
                      cell.isCurrentMonth && "bg-white",
                      isSelected && "bg-[#eef4ff] shadow-[inset_0_0_0_2px_#3f66ea]",
                      state?.tone === "assignment" &&
                        "bg-gradient-to-b from-[#f8fbff] to-[#eef5ff]",
                      state?.tone === "leave" && "bg-gradient-to-b from-[#fff6f6] to-[#ffecec]",
                      state?.tone === "preferred" &&
                        "bg-gradient-to-b from-[#fffaf0] to-[#fff3dc]",
                      state?.tone === "pending" &&
                        "bg-gradient-to-b from-[#fffaf2] to-[#fff4e2]"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      {cell.isToday ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3f66ea] text-[10px] font-extrabold text-white">
                          {cell.dayNumber}
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "text-[11px] font-extrabold",
                            cell.isCurrentMonth ? "text-[#223751]" : "text-[#9bacbe]"
                          )}
                        >
                          {cell.dayNumber}
                        </span>
                      )}
                    </div>

                    {state ? (
                      <div
                        className={cn(
                          "rounded-xl px-2.5 py-2 text-[11px] font-bold leading-[1.35]",
                          state.tone === "assignment" && "bg-[#e5f1ff] text-[#386dcb]",
                          state.tone === "leave" && "bg-[#fde7e7] text-[#b74242]",
                          state.tone === "preferred" && "bg-[#fff1da] text-[#9c6a17]",
                          state.tone === "pending" &&
                            "border border-dashed border-[#f0b25f] bg-[#fff7ea] text-[#9b680c]"
                        )}
                      >
                        <div>{state.title}</div>
                        {state.note ? (
                          <div className="mt-1 text-[10px] font-semibold opacity-80">
                            {state.note}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-transparent px-2 py-2 text-[11px] font-medium text-transparent">
                        Bos
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
