"use client";

import { AtSign, MessageSquarePlus, Paperclip, Plus, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import parseSlashCommand from "@/components/chat/utils/parseSlashCommand";

type MessageComposerProps = {
  onSend: (value: string) => void;
  prefillText?: string | null;
  onPrefillConsumed?: () => void;
  onOpenCommandPalette: () => void;
};

const COMMANDS = ["/reminder", "/task", "/shift", "/decision", "/agenda", "/poll"];

function ComposerButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
    >
      {icon}
    </button>
  );
}

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

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setValue("");
  };

  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-5">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.32)]">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
              event.preventDefault();
              onOpenCommandPalette();
            }
          }}
          rows={3}
          placeholder="Mesajinizi yazin veya / komut kullanin"
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
          <div className="mb-3 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            Komut algilandi: /{parsed.command}
            {parsed.args ? ` · ${parsed.args}` : " · icerik bekleniyor"}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ComposerButton icon={<Plus className="h-4 w-4" />} label="Ekle" />
            <ComposerButton icon={<Paperclip className="h-4 w-4" />} label="Dosya ekle" />
            <ComposerButton icon={<MessageSquarePlus className="h-4 w-4" />} label="Not ekle" />
            <ComposerButton icon={<AtSign className="h-4 w-4" />} label="Kisi etiketle" />
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              /
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.6)] transition hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            Gonder
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
