"use client";

import { AtSign, MessageSquarePlus, Paperclip, Plus, Send } from "lucide-react";
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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-slate-500 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-blue-700"
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
  const [toolsOpen, setToolsOpen] = useState(false);

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
    <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-1.5">
      <div className="mx-auto max-w-5xl">
        <div className="relative rounded-[18px] border border-slate-200 bg-gradient-to-r from-white to-[#F8FAFF] px-2.5 py-2 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.24)]">
          {(commandSuggestions.length > 0 || parsed.isCommand) ? (
            <div className="absolute bottom-[calc(100%+10px)] left-0 right-0 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-300/30 backdrop-blur-sm">
              {commandSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
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
                <div
                  className={`${commandSuggestions.length > 0 ? "mt-2" : ""} rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700`}
                >
                  Komut algilandi: /{parsed.command}
                  {parsed.args ? ` · ${parsed.args}` : " · icerik bekleniyor"}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <ComposerButton
              icon={
                <Plus
                  className={`h-3.5 w-3.5 transition-transform ${
                    toolsOpen ? "rotate-45" : ""
                  }`}
                />
              }
              label="Araclari goster"
              onClick={() => setToolsOpen((current) => !current)}
            />

            <div
              className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ease-out ${
                toolsOpen ? "max-w-80 translate-x-0 opacity-100" : "max-w-0 translate-x-2 opacity-0"
              }`}
            >
              <ComposerButton icon={<Paperclip className="h-3.5 w-3.5" />} label="Dosya ekle" />
              <ComposerButton icon={<MessageSquarePlus className="h-3.5 w-3.5" />} label="Not ekle" />
              <ComposerButton icon={<AtSign className="h-3.5 w-3.5" />} label="Kisi etiketle" />
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="rounded-xl bg-white/80 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-blue-700"
              >
                /
              </button>
            </div>

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
              rows={1}
              placeholder="Mesajinizi yazin veya / komut kullanin"
              className="h-8 min-w-0 flex-1 resize-none bg-transparent py-1 text-[13px] leading-5 text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
              type="button"
              onClick={submit}
              aria-label="Gonder"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_18px_40px_-24px_rgba(37,99,235,0.6)] transition hover:bg-blue-700"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
