"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Info, MoonStar } from "lucide-react";

export type StaffShiftPreference = {
  id: number;
  staffProfileId: number;
  shiftTypeId: number | null;
  date: string;
  status: string;
  reason: string;
};

export type StaffShiftType = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isNight: boolean;
  color: string;
};

type StaffPreferenceCalendarProps = {
  monthDate: Date;
  selectedDate: string | null;
  shiftTypes: StaffShiftType[];
  preferences: StaffShiftPreference[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (date: string) => void;
};

type SelectionPanelProps = {
  selectedDate: string | null;
  shiftTypes: StaffShiftType[];
  selectedDatePreferences: StaffShiftPreference[];
  savingShiftIds: number[];
  onToggleShift: (shiftType: StaffShiftType) => void;
};

type CalendarCell = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const dayLabels = ["PZT", "SAL", "CAR", "PER", "CUM", "CMT", "PAZ"];

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

function getMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  })
    .format(date)
    .replace(/^./, (char) => char.toUpperCase());
}

function getFullDateLabel(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date(`${date}T12:00:00`))
    .replace(/^./, (char) => char.toUpperCase());
}

function getWeekdayBadge(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { weekday: "long" })
    .format(new Date(`${date}T12:00:00`))
    .replace(/^./, (char) => char.toUpperCase());
}

function getMonthGrid(date: Date) {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const startDay = firstDay.getDay();
  const mondayBasedStart = startDay === 0 ? 6 : startDay - 1;
  const totalVisibleCells = Math.ceil((mondayBasedStart + lastDay.getDate()) / 7) * 7;
  const gridStart = new Date(year, monthIndex, 1 - mondayBasedStart);
  const today = new Date();

  return Array.from({ length: totalVisibleCells }, (_, index): CalendarCell => {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);

    return {
      date: toIsoDate(current),
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === monthIndex,
      isToday: isSameDate(current, today),
    };
  });
}

function formatShortTime(time: string) {
  return time.slice(0, 5);
}

export function StaffPreferenceSelectionPanel({
  selectedDate,
  shiftTypes,
  selectedDatePreferences,
  savingShiftIds,
  onToggleShift,
}: SelectionPanelProps) {
  return (
    <aside className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_-54px_rgba(37,99,235,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Secilen Gun
          </p>
          <h3 className="mt-3 text-[15px] font-black tracking-[-0.03em] text-slate-900">
            {selectedDate ? getFullDateLabel(selectedDate) : "Takvimden gun sec"}
          </h3>
        </div>
        {selectedDate ? (
          <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600">
            {getWeekdayBadge(selectedDate)}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-3 text-slate-500">
        <CalendarDays className="h-5 w-5 text-slate-400" />
        <p className="text-sm leading-6 text-slate-500">
          Bu gun icin tercihlerinizi isaretleyin.
        </p>
      </div>

      <div className="mt-7 space-y-4">
        {shiftTypes.map((shiftType) => {
          const activePreference = selectedDatePreferences.find(
            (item) => item.shiftTypeId === shiftType.id
          );
          const isSaving = savingShiftIds.includes(shiftType.id);

          return (
            <button
              key={shiftType.id}
              type="button"
              onClick={() => onToggleShift(shiftType)}
              disabled={!selectedDate || isSaving}
              className={[
                "w-full rounded-[24px] border px-5 py-5 text-left transition",
                activePreference
                  ? "border-blue-200 bg-blue-50/60 shadow-[0_18px_40px_-34px_rgba(37,99,235,0.3)]"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                !selectedDate ? "cursor-not-allowed opacity-55" : "",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${shiftType.color}20`,
                    color: shiftType.color,
                  }}
                >
                  {shiftType.isNight ? <MoonStar className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-black text-slate-900">{shiftType.name}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {formatShortTime(shiftType.startTime)} - {formatShortTime(shiftType.endTime)}
                      </p>
                      {shiftType.isNight ? (
                        <p className="mt-2 text-xs font-bold text-amber-600">Gece / nobet kategorisi</p>
                      ) : null}
                    </div>

                    <span
                      className={[
                        "mt-1 flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold transition",
                        activePreference
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-slate-300 bg-white text-transparent",
                      ].join(" ")}
                    >
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[22px] bg-blue-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p>Isaretlediginiz vardiyalar, planlama sirasinda tercih edilmez.</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <span className="text-sm font-semibold text-slate-500">
          {selectedDatePreferences.length} vardiya secildi
        </span>
        <button
          type="button"
          disabled
          className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-400"
        >
          Tercihleri Kaydet
        </button>
      </div>
    </aside>
  );
}

export default function StaffPreferenceCalendar({
  monthDate,
  selectedDate,
  shiftTypes,
  preferences,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDate,
}: StaffPreferenceCalendarProps) {
  const grid = getMonthGrid(monthDate);
  const preferenceMap = preferences.reduce<Record<string, StaffShiftPreference[]>>((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {});

  return (
    <section className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_-54px_rgba(37,99,235,0.38)]">
      <div className="flex flex-col gap-4">
        <div>
          <span className="inline-flex px-0 py-1 text-[13px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
            Personel Takvimi
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-4">
            <h3 className="text-[28px] font-black tracking-[-0.03em] text-slate-900">
              {getMonthTitle(monthDate)}
            </h3>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600">
              {preferences.length} tercih kaydi
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
              Ay
            </div>
            <button
              type="button"
              onClick={onToday}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={onPrevMonth}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              aria-label="Onceki ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {dayLabels.map((label) => (
            <div
              key={label}
              className="border-r border-slate-200 px-3 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500 last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-7 auto-rows-fr">
          {grid.map((cell) => {
            const items = preferenceMap[cell.date] ?? [];
            const isSelected = selectedDate === cell.date;

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate(cell.date)}
                className={[
                  "min-h-[116px] border-b border-r border-slate-200 px-3 py-3 text-left transition last:border-r-0",
                  cell.isCurrentMonth ? "bg-white" : "bg-slate-50/70",
                  isSelected ? "bg-blue-50 shadow-[inset_0_0_0_2px_#2563eb]" : "",
                  !cell.isCurrentMonth ? "text-slate-300" : "text-slate-900",
                ].join(" ")}
              >
                <div className="flex items-start justify-end">
                  <span
                    className={[
                      "text-[11px] font-bold",
                      cell.isToday ? "rounded-full bg-blue-600 px-2.5 py-1.5 text-white" : "",
                    ].join(" ")}
                  >
                    {cell.dayNumber}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {items.slice(0, 2).map((item) => {
                    const shiftType = shiftTypes.find((shift) => shift.id === item.shiftTypeId);
                    if (!shiftType) {
                      return null;
                    }

                    return (
                      <div
                        key={item.id}
                        className="truncate rounded-xl border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700"
                      >
                        {shiftType.name}
                      </div>
                    );
                  })}
                  {items.length > 2 ? (
                    <div className="text-[11px] font-semibold text-slate-400">
                      +{items.length - 2} tercih daha
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
