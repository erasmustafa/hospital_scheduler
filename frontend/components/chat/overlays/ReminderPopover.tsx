"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Reminder } from "@/types/reminder";

type ReminderPopoverProps = {
  open: boolean;
  initialTitle?: string;
  departmentId?: string;
  onClose: () => void;
  onCreate: (reminder: Reminder) => void;
};

export default function ReminderPopover({
  open,
  initialTitle,
  departmentId,
  onClose,
  onCreate,
}: ReminderPopoverProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [time, setTime] = useState("2026-04-26T11:30");

  useEffect(() => {
    setTitle(initialTitle ?? "");
  }, [initialTitle]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500">
              Quick Reminder
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Hatırlatıcı Kur
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Başlık</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">Tarih / Saat</span>
            <input
              type="datetime-local"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">Öncelik</span>
            <select className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none">
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
              <option value="critical">Kritik</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => {
              onCreate({
                id: `rem-${Date.now()}`,
                title,
                remindAt: new Date(time).toISOString(),
                targetUserIds: ["current-user"],
                targetNames: ["Mustafa Bedir"],
                departmentId,
                priority: "normal",
                repeat: "none",
              });
              onClose();
            }}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Hatırlatıcıyı Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
