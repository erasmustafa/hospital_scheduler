"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Task } from "@/types/task";

type CreateTaskModalProps = {
  open: boolean;
  initialTitle?: string;
  departmentId?: string;
  onClose: () => void;
  onCreate: (task: Task) => void;
};

export default function CreateTaskModal({
  open,
  initialTitle,
  departmentId,
  onClose,
  onCreate,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTitle(initialTitle ?? "");
  }, [initialTitle]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500">
              Message → Task
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Görev Oluştur
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

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Başlık</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Açıklama</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            />
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
                id: `task-${Date.now()}`,
                title,
                description,
                departmentId,
                dueDate: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
                priority: "normal",
                status: "todo",
              });
              setDescription("");
              onClose();
            }}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Görevi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
