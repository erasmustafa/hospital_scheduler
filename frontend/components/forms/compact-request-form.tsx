"use client";

import {
  Ban,
  CalendarDays,
  ChevronDown,
  Clock3,
  Send,
  Sun,
  Trash2,
} from "lucide-react";

type RequestType = "leave" | "unavailable" | "preferred_off";

type ShiftTypeOption = {
  id: number;
  name: string;
};

type CompactRequestFormProps = {
  requestType: RequestType;
  shiftTypeId: string;
  notes: string;
  selectedDates: string[];
  selectedDateLabel: string;
  shiftTypes: ShiftTypeOption[];
  saving: boolean;
  error?: string | null;
  onRequestTypeChange: (value: RequestType) => void;
  onShiftTypeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
};

const requestOptions = [
  { id: "leave" as const, title: "İzin", icon: CalendarDays, iconClass: "bg-red-50 text-red-500" },
  { id: "unavailable" as const, title: "Uygun Değil", icon: Ban, iconClass: "bg-red-50 text-red-500" },
  { id: "preferred_off" as const, title: "Tercihli Boş Gün", icon: Sun, iconClass: "bg-amber-50 text-amber-500" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CompactRequestForm({
  requestType,
  shiftTypeId,
  notes,
  selectedDates,
  selectedDateLabel,
  shiftTypes,
  saving,
  error,
  onRequestTypeChange,
  onShiftTypeChange,
  onNotesChange,
  onClear,
  onSubmit,
}: CompactRequestFormProps) {
  return (
    <section className="w-full rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="px-4 py-4">
        <div className="mb-4">
          <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
            Yeni Talep
          </h2>
          <p className="mt-1 text-[13px] font-medium leading-5 text-slate-500">
            Seçilen günler üzerinden talep oluştur ve yetkili onayına gönder.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {requestOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = requestType === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onRequestTypeChange(option.id)}
                className={cn(
                  "group relative min-h-[80px] rounded-2xl border px-2.5 py-2.5 text-center transition-all duration-200",
                  "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4",
                  isSelected
                    ? "border-blue-500 bg-blue-50/30 ring-blue-100"
                    : "border-slate-200 bg-white ring-transparent hover:border-slate-300"
                )}
              >
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      option.iconClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-center text-[12px] font-extrabold leading-4 text-slate-900">
                    {option.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[12px] font-extrabold text-slate-700">
            Seçilen Günler
          </label>

          <div className="flex min-h-[42px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 text-left text-[13px] font-medium text-slate-600">
            <span className="flex items-center gap-2.5">
              <CalendarDays className="h-4.5 w-4.5 text-slate-500" />
              {selectedDateLabel}
            </span>
            <CalendarDays className="hidden h-4.5 w-4.5 text-slate-500 sm:block" />
          </div>

          {selectedDates.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedDates.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"
                >
                  {date}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <label className="mb-1.5 block text-[12px] font-extrabold text-slate-700">
              Vardiya <span className="font-bold text-slate-500">(opsiyonel)</span>
            </label>

            <div className="relative">
              <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
              <select
                value={shiftTypeId}
                onChange={(event) => onShiftTypeChange(event.target.value)}
                className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-[13px] font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Tüm Vardiyalar</option>
                {shiftTypes.map((shiftType) => (
                  <option key={shiftType.id} value={String(shiftType.id)}>
                    {shiftType.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-extrabold text-slate-700">
              Not <span className="font-bold text-slate-500">(opsiyonel)</span>
            </label>

            <div className="relative">
              <textarea
                value={notes}
                onChange={(event) => onNotesChange(event.target.value.slice(0, 120))}
                placeholder="Kısa not ekle"
                rows={3}
                className="h-[72px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
              <span className="absolute bottom-2.5 right-3 text-[11px] font-semibold text-slate-400">
                {notes.length} / 120
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-slate-200 px-4 py-3 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[13px] font-extrabold text-slate-600 transition hover:bg-slate-50"
        >
          <Trash2 className="h-4 w-4" />
          Temizle
        </button>

        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-[13px] font-extrabold text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
          {saving ? "Kaydediliyor..." : "Talebi Gönder"}
        </button>
      </div>
    </section>
  );
}
