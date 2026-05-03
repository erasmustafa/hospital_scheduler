"use client";

import { Ban, CalendarDays, ChevronLeft, ChevronRight, Clock3, MoonStar, X } from "lucide-react";

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
  selectedDatePreferences: StaffShiftPreference[];
  savingShiftIds: number[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (date: string) => void;
  onToggleShift: (shiftType: StaffShiftType) => void;
  onClearSelection?: () => void;
};

type SelectionPanelProps = {
  selectedDate: string | null;
  shiftTypes: StaffShiftType[];
  selectedDatePreferences: StaffShiftPreference[];
  savingShiftIds: number[];
  onToggleShift: (shiftType: StaffShiftType) => void;
  onClose?: () => void;
};

type CalendarCell = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const dayLabels = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];

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
  onClose,
}: SelectionPanelProps) {
  return (
    <aside className="flex w-full max-w-[280px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white/95 shadow-[0_24px_70px_-40px_rgba(37,99,235,0.32)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Vardiya Engelle
          </p>
          <h3 className="mt-1 truncate text-sm font-bold text-slate-900">
            {selectedDate ? getFullDateLabel(selectedDate) : "Takvimden gün seç"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {selectedDate ? (
            <div className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">
              {getWeekdayBadge(selectedDate)}
            </div>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Seçimi kapat"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2 p-3">
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
                "flex w-full items-center justify-between rounded-[18px] border px-3 py-3 text-left transition",
                activePreference
                  ? "border-blue-200 bg-blue-50/70 shadow-[0_16px_30px_-26px_rgba(37,99,235,0.35)]"
                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                !selectedDate ? "cursor-not-allowed opacity-55" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${shiftType.color}20`,
                    color: shiftType.color,
                  }}
                >
                  {shiftType.isNight ? <MoonStar className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                </div>

                <div>
                  <p className="text-[13px] font-bold text-slate-900">{shiftType.name}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {formatShortTime(shiftType.startTime)} - {formatShortTime(shiftType.endTime)}
                  </p>
                </div>
              </div>

              <span
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-black transition",
                  activePreference
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-slate-300 bg-white text-transparent",
                ].join(" ")}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default function StaffPreferenceCalendar({
  monthDate,
  selectedDate,
  shiftTypes,
  preferences,
  selectedDatePreferences,
  savingShiftIds,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDate,
  onToggleShift,
  onClearSelection,
}: StaffPreferenceCalendarProps) {
  const grid = getMonthGrid(monthDate);
  const weekCount = Math.max(1, grid.length / 7);
  const preferenceMap = preferences.reduce<Record<string, StaffShiftPreference[]>>((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {});

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[20px] font-bold tracking-[-0.02em] text-slate-900">
              {getMonthTitle(monthDate)}
            </h3>
            <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
              {preferences.length} tercih kaydı
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              Ay
            </div>
            <button
              type="button"
              onClick={onToday}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={onPrevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
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
              className="border-r border-slate-200 px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1">
          <div
            className="grid h-full grid-cols-7"
            style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
          >
            {grid.map((cell) => {
              const items = preferenceMap[cell.date] ?? [];
              const isSelected = selectedDate === cell.date;

              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onSelectDate(cell.date)}
                  className={[
                    "group relative h-full min-h-0 overflow-hidden border-b border-r border-slate-200 px-3 py-3 text-left transition last:border-r-0",
                    cell.isCurrentMonth ? "bg-white" : "bg-slate-50/70",
                    isSelected
                      ? "bg-blue-50 shadow-[inset_0_0_0_2px_#2563eb]"
                      : cell.isCurrentMonth
                        ? "hover:bg-rose-50/75 hover:shadow-[inset_0_0_0_1px_rgba(244,63,94,0.24)]"
                        : "",
                    !cell.isCurrentMonth ? "text-slate-300" : "text-slate-900",
                  ].join(" ")}
                >
                  {cell.isCurrentMonth && !isSelected ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-rose-100/90 text-rose-500 shadow-[0_18px_30px_-22px_rgba(244,63,94,0.45)]">
                        <Ban className="h-6 w-6" />
                      </div>
                    </div>
                  ) : null}

                  <span
                    className={[
                      "absolute right-3 top-3 text-[10px] font-bold",
                      cell.isToday ? "rounded-full bg-blue-600 px-2.5 py-1.5 text-white" : "",
                    ].join(" ")}
                  >
                    {cell.dayNumber}
                  </span>

                  <div className="mt-7 flex flex-col gap-1.5">
                    {items.slice(0, 2).map((item) => {
                      const shiftType = shiftTypes.find((shift) => shift.id === item.shiftTypeId);
                      if (!shiftType) {
                        return null;
                      }

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-left shadow-[0_12px_24px_-24px_rgba(37,99,235,0.35)]"
                        >
                          <p className="text-[11px] font-black text-blue-700">{shiftType.name}</p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-500">
                            {formatShortTime(shiftType.startTime)} - {formatShortTime(shiftType.endTime)}
                          </p>
                        </div>
                      );
                    })}
                    {items.length > 2 ? (
                      <span className="text-[11px] font-semibold text-blue-600">
                        +{items.length - 2} tercih daha
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-end p-3">
            <div className="pointer-events-auto w-full max-w-[280px]">
              <StaffPreferenceSelectionPanel
                selectedDate={selectedDate}
                shiftTypes={shiftTypes}
                selectedDatePreferences={selectedDatePreferences}
                savingShiftIds={savingShiftIds}
                onToggleShift={onToggleShift}
                onClose={onClearSelection}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
