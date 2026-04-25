"use client";

import { Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import parseSlashCommand from "@/components/chat/utils/parseSlashCommand";

type MessageComposerProps = {
  onSend: (value: string) => void;
  prefillText?: string | null;
  onPrefillConsumed?: () => void;
  onOpenCommandPalette: () => void;
};

const COMMANDS = ["/reminder", "/task", "/shift", "/decision", "/agenda", "/poll"];

export default function MessageComposer({
  onSend,
  prefillText,
  onPrefillConsumed,
  onOpenCommandPalette,
}: MessageComposerProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (prefillText) {
      setValue(prefillText);
      onPrefillConsumed?.();
    }
  }, [onPrefillConsumed, prefillText]);

  const parsed = useMemo(() => parseSlashCommand(value), [value]);
  const commandSuggestions = useMemo(() => {
    if (!value.startsWith("/")) {
      return [];
    }
    return COMMANDS.filter((command) => command.startsWith(value.trim()) || value.trim() === "/");
  }, [value]);

  return (
    <div className="border-t border-slate-200 bg-white px-6 py-5">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-inner shadow-slate-100">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          placeholder="Mesajınızı yazın veya / komutları ile görev, reminder, shift aksiyonu başlatın"
          className="w-full resize-none bg-transparent text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400"
        />

        {commandSuggestions.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {commandSuggestions.map((command) => (
              <button
                key={command}
                type="button"
                onClick={() => setValue(`${command} `)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
              >
                {command}
              </button>
            ))}
          </div>
        ) : null}

        {parsed.isCommand ? (
          <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            Komut algılandı: <strong>/{parsed.command}</strong>
            {parsed.args ? ` · İçerik: ${parsed.args}` : " · İçerik bekleniyor"}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            Komut Paleti
          </button>

          <button
            type="button"
            onClick={() => {
              const trimmed = value.trim();
              if (!trimmed) {
                return;
              }
              onSend(trimmed);
              setValue("");
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/80"
          >
            <Send className="h-4 w-4" />
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
