"use client";

import { CalendarPlus, ClipboardList, CornerUpLeft, Link2, MoreHorizontal, Pin, Siren, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type MessageActionType =
  | "reply"
  | "create_task"
  | "create_reminder"
  | "add_to_agenda"
  | "mark_as_decision"
  | "pin"
  | "copy_link";

type MessageActionMenuProps = {
  onAction: (action: MessageActionType) => void;
};

const ACTIONS: Array<{
  key: MessageActionType;
  label: string;
  icon: ReactNode;
}> = [
  { key: "reply", label: "Reply", icon: <CornerUpLeft className="h-4 w-4" /> },
  { key: "create_task", label: "Göreve çevir", icon: <ClipboardList className="h-4 w-4" /> },
  { key: "create_reminder", label: "Hatırlatıcı kur", icon: <Siren className="h-4 w-4" /> },
  { key: "add_to_agenda", label: "Ajandaya ekle", icon: <CalendarPlus className="h-4 w-4" /> },
  { key: "mark_as_decision", label: "Karar olarak işaretle", icon: <Sparkles className="h-4 w-4" /> },
  { key: "pin", label: "Pinle", icon: <Pin className="h-4 w-4" /> },
  { key: "copy_link", label: "Linki kopyala", icon: <Link2 className="h-4 w-4" /> },
];

export default function MessageActionMenu({ onAction }: MessageActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-xl border border-slate-200 bg-white/90 p-2 text-slate-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-blue-200 hover:text-blue-600"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/30">
          {ACTIONS.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                onAction(action.key);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="text-blue-600">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
