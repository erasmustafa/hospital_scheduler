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
  const bubbleTone = isOwnMessage
    ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
    : "border-slate-200 bg-white";

  const contentTone =
    message.type === "system"
      ? "text-slate-500"
      : message.type === "decision"
        ? "text-slate-800"
        : "text-slate-700";

  return (
    <article className={`group flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[720px] rounded-3xl border px-4 py-4 shadow-sm shadow-slate-200/70 ${bubbleTone}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
              {message.sender.initials ?? message.sender.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{message.sender.name}</p>
                {message.isPinned ? <Pin className="h-3.5 w-3.5 text-blue-600" /> : null}
                {message.type === "system" ? <Bot className="h-3.5 w-3.5 text-slate-400" /> : null}
              </div>
              <p className="text-xs text-slate-500">
                {message.sender.role ?? "Kullanıcı"} · {formatMessageTime(message.createdAt)}
              </p>
            </div>
          </div>
          <MessageActionMenu onAction={(action) => onAction(message, action)} />
        </div>

        <p className={`mt-4 text-sm leading-7 ${contentTone}`}>{message.content}</p>

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
                summary: String(message.metadata.decisionSummary ?? "Karar kaydı"),
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
