"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, ChevronLeft, ChevronRight, Clock3, LockOpen, MoonStar } from "lucide-react";

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
  onSelectDate: (date: string | null) => void;
  onToggleShift: (shiftType: StaffShiftType, targetDate?: string) => void;
  onToggleMonthShift: (shiftType: StaffShiftType, targetDates: string[]) => void;
};

type SelectionMenuProps = {
  shiftTypes: StaffShiftType[];
  selectedDatePreferences: StaffShiftPreference[];
  savingShiftIds: number[];
  onToggleShift: (shiftType: StaffShiftType) => void;
  title?: string | null;
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

function ShiftSelectionMenu({
  shiftTypes,
  selectedDatePreferences,
  savingShiftIds,
  onToggleShift,
  title,
}: SelectionMenuProps) {
  return (
    <div className="w-[228px] rounded-[18px] border border-slate-200 bg-white/95 p-2 shadow-[0_26px_54px_-34px_rgba(15,23,42,0.36)] backdrop-blur-sm">
      {title ? (
        <div className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </div>
      ) : null}
      <div className="space-y-1.5">
        {shiftTypes.map((shiftType) => {
          const activePreference = selectedDatePreferences.find(
            (item) => item.shiftTypeId === shiftType.id
          );
          const isSaving = savingShiftIds.includes(shiftType.id);

          return (
            <button
              key={shiftType.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleShift(shiftType);
              }}
              disabled={isSaving}
              className={[
                "flex w-full items-center justify-between rounded-[12px] border px-2.5 py-2 text-left transition",
                activePreference
                  ? "border-rose-200 bg-rose-50/80 shadow-[0_14px_24px_-24px_rgba(244,63,94,0.32)]"
                  : "border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50/40",
                isSaving ? "opacity-60" : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${shiftType.color}20`,
                    color: shiftType.color,
                  }}
                >
                  {shiftType.isNight ? <MoonStar className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-900">
                    {shiftType.name}
                    <span className="font-semibold text-slate-500">
                      {" / "}
                      {formatShortTime(shiftType.startTime)} - {formatShortTime(shiftType.endTime)}
                    </span>
                  </p>
                </div>
              </div>

              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-black transition",
                  activePreference
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-slate-300 bg-white text-transparent",
                ].join(" ")}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
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
  onToggleMonthShift,
}: StaffPreferenceCalendarProps) {
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [renderedMenuDate, setRenderedMenuDate] = useState<string | null>(selectedDate);
  const [menuOpen, setMenuOpen] = useState(Boolean(selectedDate));
  const [renderedBulkMenu, setRenderedBulkMenu] = useState(false);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const grid = getMonthGrid(monthDate);
  const weekCount = Math.max(1, grid.length / 7);
  const currentMonthDates = grid.filter((cell) => cell.isCurrentMonth).map((cell) => cell.date);
  const preferenceMap = preferences.reduce<Record<string, StaffShiftPreference[]>>((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {});

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (selectedDate) {
      setRenderedMenuDate(selectedDate);
      setMenuOpen(true);
      return;
    }

    if (renderedMenuDate) {
      setMenuOpen(false);
      closeTimerRef.current = setTimeout(() => {
        setRenderedMenuDate(null);
        closeTimerRef.current = null;
      }, 180);
    }
  }, [renderedMenuDate, selectedDate]);

  useEffect(() => {
    if (bulkCloseTimerRef.current) {
      clearTimeout(bulkCloseTimerRef.current);
      bulkCloseTimerRef.current = null;
    }

    if (bulkMenuOpen) {
      setRenderedBulkMenu(true);
      return;
    }

    if (renderedBulkMenu) {
      bulkCloseTimerRef.current = setTimeout(() => {
        setRenderedBulkMenu(false);
        bulkCloseTimerRef.current = null;
      }, 180);
    }
  }, [bulkMenuOpen, renderedBulkMenu]);

  useEffect(() => {
    if (!selectedDate && !bulkMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) {
        onSelectDate(null);
        setBulkMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [bulkMenuOpen, onSelectDate, selectedDate]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (bulkCloseTimerRef.current) {
        clearTimeout(bulkCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <div ref={calendarRef} className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white">
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setBulkMenuOpen((current) => !current)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50"
              >
                Tümünü Seç
              </button>
              {renderedBulkMenu ? (
                <div
                  className={[
                    "absolute right-0 top-[calc(100%+10px)] z-[90] transition-all duration-200 ease-out",
                    bulkMenuOpen
                      ? "translate-y-0 scale-100 opacity-100"
                      : "pointer-events-none -translate-y-1 scale-95 opacity-0",
                  ].join(" ")}
                >
                  <ShiftSelectionMenu
                    shiftTypes={shiftTypes}
                    selectedDatePreferences={shiftTypes
                      .filter((shiftType) =>
                        currentMonthDates.every((date) =>
                          preferences.some(
                            (item) => item.date === date && item.shiftTypeId === shiftType.id
                          )
                        )
                      )
                      .map((shiftType) => ({
                        id: -shiftType.id,
                        staffProfileId: -1,
                        shiftTypeId: shiftType.id,
                        date: currentMonthDates[0] ?? "",
                        status: "unavailable",
                        reason: "Ay boyu bloklu",
                      }))}
                    savingShiftIds={savingShiftIds}
                    onToggleShift={(shiftType) => {
                      onToggleMonthShift(shiftType, currentMonthDates);
                      setBulkMenuOpen(false);
                    }}
                  />
                </div>
              ) : null}
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
            {grid.map((cell, index) => {
              const items = preferenceMap[cell.date] ?? [];
              const isSelected = selectedDate === cell.date;
              const isMenuRendered = renderedMenuDate === cell.date;
              const hasBlockedShifts = items.length > 0;
              const rowIndex = Math.floor(index / 7);
              const columnIndex = index % 7;
              const openUpwards = rowIndex >= weekCount - 2;
              const horizontalMenuPosition =
                columnIndex <= 1
                  ? "left-0 translate-x-0"
                  : columnIndex >= 5
                    ? "right-0 translate-x-0"
                    : "left-1/2 -translate-x-1/2";

              return (
                <div
                  key={cell.date}
                  className={[
                    "group relative h-full min-h-0 overflow-visible border-b border-r border-slate-200 px-3 py-3 text-left transition-colors duration-300 last:border-r-0",
                    isMenuRendered ? "z-20" : "",
                    cell.isCurrentMonth ? "bg-white" : "bg-slate-50/70",
                    hasBlockedShifts ? "cursor-default" : "",
                    isSelected
                      ? hasBlockedShifts
                        ? "shadow-[inset_0_0_0_2px_rgba(244,63,94,0.34)]"
                        : "bg-rose-50/80 shadow-[inset_0_0_0_2px_rgba(244,63,94,0.34)]"
                      : "",
                    !cell.isCurrentMonth ? "text-slate-300" : "text-slate-900",
                  ].join(" ")}
                >
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
                        <button
                          key={item.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleShift(shiftType, cell.date);
                          }}
                          className="group/blocked relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-rose-300 bg-rose-50 px-2 py-1.5 text-left transition duration-200 hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          <div className="flex w-full flex-col text-left transition-opacity duration-150 group-hover/blocked:opacity-0">
                            <p className="truncate text-[11px] font-bold text-rose-700">
                              {shiftType.name}
                            </p>
                          </div>
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/blocked:opacity-100">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_16px_28px_-18px_rgba(16,185,129,0.65)]">
                              <LockOpen className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {items.length > 2 ? (
                      <span className="text-[11px] font-semibold text-blue-600">
                        +{items.length - 2} tercih daha
                      </span>
                    ) : null}
                  </div>

                  {cell.isCurrentMonth && !hasBlockedShifts ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                        onSelectDate(isSelected ? null : cell.date);
                          setBulkMenuOpen(false);
                        }}
                        className={[
                          "z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-[18px] border transition duration-200 ease-out",
                          isSelected
                            ? "border-rose-200 bg-rose-100 text-rose-600 shadow-[0_20px_34px_-20px_rgba(244,63,94,0.46)]"
                            : "border-rose-100 bg-rose-100/90 text-rose-500 opacity-0 shadow-[0_18px_30px_-22px_rgba(244,63,94,0.32)] group-hover:-translate-y-0.5 group-hover:scale-[1.06] group-hover:border-rose-200 group-hover:bg-rose-100 group-hover:opacity-100 group-hover:shadow-[0_22px_38px_-20px_rgba(244,63,94,0.42)]",
                        ].join(" ")}
                        aria-label={`${cell.dayNumber}. gün için vardiya engelleme menüsünü aç`}
                      >
                        <Ban className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
                      </button>
                    </div>
                  ) : null}

                  {isMenuRendered && cell.isCurrentMonth ? (
                    <div
                      className={[
                        "absolute z-[80] transition-all duration-200 ease-out",
                        horizontalMenuPosition,
                        openUpwards ? "bottom-[calc(50%+34px)]" : "top-[calc(50%+34px)]",
                        menuOpen
                          ? "translate-y-0 scale-100 opacity-100"
                          : "pointer-events-none -translate-y-1 scale-95 opacity-0",
                      ].join(" ")}
                    >
                      <ShiftSelectionMenu
                        shiftTypes={shiftTypes}
                        selectedDatePreferences={selectedDatePreferences}
                        savingShiftIds={savingShiftIds}
                        onToggleShift={onToggleShift}
                        title={null}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
