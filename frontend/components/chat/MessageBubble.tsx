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
      className={`group flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"} ${
        isOwnMessage ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
          isSystem
            ? "bg-blue-600 text-white"
            : isOwnMessage
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-900 ring-1 ring-slate-200"
        }`}
      >
        {message.sender.initials ?? message.sender.name.slice(0, 2).toUpperCase()}
      </div>

      <div
        className={`max-w-[720px] rounded-[24px] border px-4 py-3 shadow-sm transition group-hover:shadow-md ${
          isSystem
            ? "border-blue-100 bg-blue-50"
            : isOwnMessage
              ? "border-blue-100 bg-blue-50"
              : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-slate-900">{message.sender.name}</p>
              {message.sender.role ? (
                <span className="text-xs text-slate-500">/ {message.sender.role}</span>
              ) : null}
              {message.isPinned ? <Pin className="h-3.5 w-3.5 text-blue-600" /> : null}
              {isSystem ? <Bot className="h-3.5 w-3.5 text-slate-400" /> : null}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {formatMessageTime(message.createdAt)}
            </p>
          </div>
          <MessageActionMenu onAction={(action) => onAction(message, action)} />
        </div>

        <p
          className={`mt-2 text-sm leading-6 ${
            isSystem ? "text-slate-600" : "text-slate-700"
          }`}
        >
          {message.content}
        </p>

        {message.type === "task" && message.metadata ? (
          <div className="mt-4">
            <TaskMiniCard task={message.metadata as unknown as Task} />
          </div>
        ) : null}

        {message.type === "reminder" && message.metadata ? (
          <div className="mt-4">
            <ReminderMiniCard reminder={message.metadata as unknown as Reminder} />
          </div>
        ) : null}

        {message.type === "shift" && message.metadata ? (
          <div className="mt-4">
            <ShiftMiniCard shift={message.metadata as unknown as ShiftCardItem} />
          </div>
        ) : null}

        {message.type === "decision" && message.metadata ? (
          <div className="mt-4">
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
