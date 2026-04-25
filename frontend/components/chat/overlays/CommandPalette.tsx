"use client";

import { Command, Search, X } from "lucide-react";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onRunCommand: (value: string) => void;
};

const COMMANDS = [
  "Yeni görev oluştur",
  "Hatırlatıcı kur",
  "Vardiya ara",
  "Personel ara",
  "Birim değiştir",
  "Bugünkü nöbetleri göster",
  "Kararları listele",
];

export default function CommandPalette({
  open,
  onClose,
  onRunCommand,
}: CommandPaletteProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/30 p-6 pt-24">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/30">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            placeholder="Komut veya kişi ara"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {COMMANDS.map((command) => (
            <button
              key={command}
              type="button"
              onClick={() => {
                onRunCommand(command);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <Command className="h-4 w-4" />
              </div>
              {command}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
