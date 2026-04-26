import { Bot, Pin } from "lucide-react";
import DecisionCard from "@/components/chat/cards/DecisionCard";
import ReminderMiniCard from "@/components/chat/cards/ReminderMiniCard";
import ShiftMiniCard from "@/components/chat/cards/ShiftMiniCard";
import TaskMiniCard from "@/components/chat/cards/TaskMiniCard";
import MessageActionMenu, { type MessageActionType } from "@/components/chat/overlays/MessageActionMenu";
import { formatMessageTime } from "@/components/chat/utils/messageFormatters";
import type { Message, PinnedDecision, ShiftCardItem } from "@/types/chat";
import type { Reminder } from "@/types/reminder";
import type { Task } from "@/types/task";

type MessageBubbleProps = {
  message: Message;
  isOwnMessage: boolean;
  onAction: (message: Message, action: MessageActionType) => void;
};

export default function MessageBubble({
  message,
  isOwnMessage,
  onAction,
}: MessageBubbleProps) {
  const isSystem = message.type === "system";

  return (
    <article
      className={`group flex gap-0.5 ${isOwnMessage ? "justify-end" : "justify-start"} ${
        isOwnMessage ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black shadow-sm ${
          isSystem
            ? "bg-blue-600 text-white"
            : isOwnMessage
              ? "bg-slate-900 text-white"
              : "bg-[#20284f] text-white"
        }`}
      >
        {message.sender.initials ?? message.sender.name.slice(0, 2).toUpperCase()}
        {!isSystem && !isOwnMessage ? (
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-emerald-500" />
        ) : null}
      </div>

      <div
        className={`max-w-[680px] rounded-[18px] border px-2 py-1.5 shadow-[0_12px_24px_-26px_rgba(15,23,42,0.22)] transition group-hover:shadow-[0_16px_32px_-26px_rgba(15,23,42,0.26)] ${
          isSystem
            ? "border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#edf5ff_100%)]"
            : isOwnMessage
              ? "border-blue-100 bg-[linear-gradient(180deg,#f7faff_0%,#eef4ff_100%)]"
              : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[11px] font-medium text-slate-900">{message.sender.name}</p>
              {message.sender.role ? (
                <span className="truncate text-[10px] text-slate-500">/ {message.sender.role}</span>
              ) : null}
              {message.isPinned ? <Pin className="h-3.5 w-3.5 text-blue-600" /> : null}
              {isSystem ? <Bot className="h-3.5 w-3.5 text-slate-400" /> : null}
            </div>
          </div>
          <MessageActionMenu onAction={(action) => onAction(message, action)} />
        </div>

        <p
          className={`mt-1 text-[11px] leading-[18px] ${
            isSystem ? "text-slate-600" : "text-slate-700"
          }`}
        >
          {message.content}
        </p>

        <div className="mt-1 flex justify-end">
          <p className="text-[10px] text-slate-500">{formatMessageTime(message.createdAt)}</p>
        </div>

        {message.type === "task" && message.metadata ? (
          <div className="mt-1.5">
            <TaskMiniCard task={message.metadata as unknown as Task} />
          </div>
        ) : null}

        {message.type === "reminder" && message.metadata ? (
          <div className="mt-1.5">
            <ReminderMiniCard reminder={message.metadata as unknown as Reminder} />
          </div>
        ) : null}

        {message.type === "shift" && message.metadata ? (
          <div className="mt-1.5">
            <ShiftMiniCard shift={message.metadata as unknown as ShiftCardItem} />
          </div>
        ) : null}

        {message.type === "decision" && message.metadata ? (
          <div className="mt-1.5">
            <DecisionCard
              decision={{
                id: message.id,
                title: message.content,
                summary: String(message.metadata.decisionSummary ?? "Karar kaydi"),
                createdAt: message.createdAt,
                ownerName: String(message.metadata.decisionOwner ?? message.sender.name),
              } satisfies PinnedDecision}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
