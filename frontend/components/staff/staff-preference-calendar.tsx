"use client";

import { ChevronLeft, ChevronRight, Clock3, MoonStar } from "lucide-react";

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
  savingShiftIds: number[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (date: string) => void;
  onToggleShift: (shiftType: StaffShiftType) => void;
};

type CalendarCell = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const dayLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

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

function shiftLabel(shiftType: StaffShiftType) {
  return `${shiftType.name} · ${formatShortTime(shiftType.startTime)}-${formatShortTime(
    shiftType.endTime
  )}`;
}

export default function StaffPreferenceCalendar({
  monthDate,
  selectedDate,
  shiftTypes,
  preferences,
  savingShiftIds,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDate,
  onToggleShift,
}: StaffPreferenceCalendarProps) {
  const grid = getMonthGrid(monthDate);
  const preferenceMap = preferences.reduce<Record<string, StaffShiftPreference[]>>((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {});

  const selectedDatePreferences = selectedDate ? preferenceMap[selectedDate] ?? [] : [];

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_-54px_rgba(37,99,235,0.38)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
            Personel Takvimi
          </span>
          <h2 className="mt-3 text-[30px] font-black tracking-[-0.04em] text-slate-900">
            Çalışmak İstemediği Mesaileri Seç
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Günü seç, ardından o gün içinde tercih edilmeyen mesaileri işaretle. İşaretlenen vardiyalar
            planlama sırasında personelin uygun olmadığı tercih olarak değerlendirilir.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-slate-50/90 p-2">
          <button
            type="button"
            onClick={onToday}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={onPrevMonth}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
            aria-label="Önceki ay"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
            aria-label="Sonraki ay"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_360px]">
        <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-[28px] font-black tracking-[-0.03em] text-slate-900">
                {getMonthTitle(monthDate)}
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Aylık Mesai Tercih Takvimi
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
              {preferences.length} tercih kaydı
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

          <div className="grid grid-cols-7">
            {grid.map((cell) => {
              const items = preferenceMap[cell.date] ?? [];
              const isSelected = selectedDate === cell.date;

              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onSelectDate(cell.date)}
                  className={[
                    "min-h-[126px] border-b border-r border-slate-200 px-3 py-3 text-left transition last:border-r-0",
                    cell.isCurrentMonth ? "bg-white" : "bg-slate-50/70",
                    isSelected ? "bg-blue-50 shadow-[inset_0_0_0_2px_#4A6CF7]" : "",
                    !cell.isCurrentMonth ? "text-slate-300" : "text-slate-900",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "text-[13px] font-extrabold",
                        cell.isToday ? "rounded-full bg-blue-600 px-2 py-1 text-white" : "",
                      ].join(" ")}
                    >
                      {cell.dayNumber}
                    </span>
                    {items.length > 0 ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                        {items.length} mesai
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {items.slice(0, 3).map((item) => {
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
                    {items.length > 3 ? (
                      <div className="text-[11px] font-semibold text-slate-400">
                        +{items.length - 3} tercih daha
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Seçilen Gün
              </p>
              <h3 className="mt-2 text-[22px] font-black tracking-[-0.03em] text-slate-900">
                {selectedDate
                  ? new Intl.DateTimeFormat("tr-TR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                      .format(new Date(`${selectedDate}T12:00:00`))
                      .replace(/^./, (char) => char.toUpperCase())
                  : "Bir gün seç"}
              </h3>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
              İstenmeyen mesailer
            </div>
          </div>

          <div className="mt-5 space-y-3">
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
                    "w-full rounded-[22px] border px-4 py-3 text-left transition",
                    activePreference
                      ? "border-blue-200 bg-white shadow-[0_18px_40px_-30px_rgba(37,99,235,0.45)]"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60",
                    !selectedDate ? "cursor-not-allowed opacity-55" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: `${shiftType.color}20`,
                        color: shiftType.color,
                      }}
                    >
                      {shiftType.isNight ? <MoonStar className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-bold text-slate-900">{shiftType.name}</span>
                        {activePreference ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                            Seçili
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {shiftLabel(shiftType)}
                      </p>
                      {shiftType.isNight ? (
                        <p className="mt-2 text-[11px] font-semibold text-amber-600">
                          Gece / nöbet kategorisi
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
