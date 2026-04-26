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
      className={`group flex gap-1 ${isOwnMessage ? "justify-end" : "justify-start"} ${
        isOwnMessage ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black shadow-sm ${
          isSystem
            ? "bg-blue-600 text-white"
            : isOwnMessage
              ? "bg-slate-900 text-white"
              : "bg-[#20284f] text-white"
        }`}
      >
        {message.sender.initials ?? message.sender.name.slice(0, 2).toUpperCase()}
        {!isSystem && !isOwnMessage ? (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
        ) : null}
      </div>

      <div
        className={`max-w-[720px] rounded-[20px] border px-2.5 py-2 shadow-[0_14px_30px_-30px_rgba(15,23,42,0.24)] transition group-hover:shadow-[0_18px_38px_-30px_rgba(15,23,42,0.28)] ${
          isSystem
            ? "border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#edf5ff_100%)]"
            : isOwnMessage
              ? "border-blue-100 bg-[linear-gradient(180deg,#f7faff_0%,#eef4ff_100%)]"
              : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]"
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] font-semibold text-slate-900">{message.sender.name}</p>
              {message.sender.role ? (
                <span className="text-[10px] text-slate-500">/ {message.sender.role}</span>
              ) : null}
              {message.isPinned ? <Pin className="h-3.5 w-3.5 text-blue-600" /> : null}
              {isSystem ? <Bot className="h-3.5 w-3.5 text-slate-400" /> : null}
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {formatMessageTime(message.createdAt)}
            </p>
          </div>
          <MessageActionMenu onAction={(action) => onAction(message, action)} />
        </div>

        <p
          className={`mt-1.5 text-[12px] leading-5 ${
            isSystem ? "text-slate-600" : "text-slate-700"
          }`}
        >
          {message.content}
        </p>

        {message.type === "task" && message.metadata ? (
          <div className="mt-2">
            <TaskMiniCard task={message.metadata as unknown as Task} />
          </div>
        ) : null}

        {message.type === "reminder" && message.metadata ? (
          <div className="mt-2">
            <ReminderMiniCard reminder={message.metadata as unknown as Reminder} />
          </div>
        ) : null}

        {message.type === "shift" && message.metadata ? (
          <div className="mt-2">
            <ShiftMiniCard shift={message.metadata as unknown as ShiftCardItem} />
          </div>
        ) : null}

        {message.type === "decision" && message.metadata ? (
          <div className="mt-2">
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
