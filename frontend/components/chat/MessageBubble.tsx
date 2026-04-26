"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Clock3,
  Pin,
} from "lucide-react";
import DecisionCard from "@/components/chat/cards/DecisionCard";
import ReminderMiniCard from "@/components/chat/cards/ReminderMiniCard";
import ShiftMiniCard from "@/components/chat/cards/ShiftMiniCard";
import TaskMiniCard from "@/components/chat/cards/TaskMiniCard";
import MessageActionMenu, {
  type MessageActionType,
} from "@/components/chat/overlays/MessageActionMenu";
import { formatMessageTime } from "@/components/chat/utils/messageFormatters";
import type {
  Message,
  PinnedDecision,
  ShiftCardItem,
} from "@/types/chat";
import type { Reminder, ReminderPriority, ReminderRepeat } from "@/types/reminder";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

type MessageBubbleProps = {
  message: Message;
  isOwnMessage: boolean;
  onAction: (message: Message, action: MessageActionType) => void;
};

function getSenderInitials(message: Message) {
  if (message.sender.initials) {
    return message.sender.initials;
  }

  return message.sender.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function buildTaskFromMessage(message: Message): Task | null {
  if (message.type !== "task") {
    return null;
  }

  const metadata = message.metadata ?? {};

  return {
    id: `${message.id}-task`,
    title: typeof metadata.title === "string" ? metadata.title : "Gorev",
    assigneeName:
      typeof metadata.assigneeName === "string" ? metadata.assigneeName : message.sender.name,
    priority:
      typeof metadata.priority === "string"
        ? (metadata.priority as TaskPriority)
        : "normal",
    status:
      typeof metadata.status === "string"
        ? (metadata.status as TaskStatus)
        : "todo",
    sourceMessageId: message.id,
  };
}

function buildReminderFromMessage(message: Message): Reminder | null {
  if (message.type !== "reminder") {
    return null;
  }

  const metadata = message.metadata ?? {};

  return {
    id: `${message.id}-reminder`,
    title:
      typeof metadata.title === "string"
        ? metadata.title
        : "Hatirlatici",
    remindAt:
      typeof metadata.remindAt === "string" ? metadata.remindAt : message.createdAt,
    targetUserIds: [],
    targetNames: Array.isArray(metadata.targetNames)
      ? metadata.targetNames.filter((item): item is string => typeof item === "string")
      : [message.sender.name],
    priority:
      typeof metadata.priority === "string"
        ? (metadata.priority as ReminderPriority)
        : "normal",
    repeat:
      typeof metadata.repeat === "string"
        ? (metadata.repeat as ReminderRepeat)
        : "none",
    sourceMessageId: message.id,
  };
}

function buildShiftFromMessage(message: Message): ShiftCardItem | null {
  if (message.type !== "shift") {
    return null;
  }

  const metadata = message.metadata ?? {};

  return {
    id: `${message.id}-shift`,
    staffName:
      typeof metadata.staffName === "string" ? metadata.staffName : message.sender.name,
    shiftLabel:
      typeof metadata.shiftLabel === "string" ? metadata.shiftLabel : "Vardiya",
    start: typeof metadata.start === "string" ? metadata.start : "--:--",
    end: typeof metadata.end === "string" ? metadata.end : "--:--",
    departmentId: message.departmentId,
  };
}

function buildDecisionFromMessage(message: Message): PinnedDecision | null {
  if (message.type !== "decision") {
    return null;
  }

  const metadata = message.metadata ?? {};

  return {
    id: `${message.id}-decision`,
    title:
      typeof metadata.title === "string"
        ? metadata.title
        : "Karar notu",
    summary:
      typeof metadata.decisionSummary === "string"
        ? metadata.decisionSummary
        : message.content,
    createdAt: message.createdAt,
    ownerName:
      typeof metadata.decisionOwner === "string"
        ? metadata.decisionOwner
        : message.sender.name,
  };
}

export default function MessageBubble({
  message,
  isOwnMessage,
  onAction,
}: MessageBubbleProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const taskCard = useMemo(() => buildTaskFromMessage(message), [message]);
  const reminderCard = useMemo(() => buildReminderFromMessage(message), [message]);
  const shiftCard = useMemo(() => buildShiftFromMessage(message), [message]);
  const decisionCard = useMemo(() => buildDecisionFromMessage(message), [message]);

  const hasInteractiveCard = Boolean(taskCard || reminderCard || shiftCard || decisionCard);

  const detailLabel = taskCard
    ? "Gorev ayrintisi"
    : reminderCard
      ? "Hatirlatici ayrintisi"
      : shiftCard
        ? "Vardiya ayrintisi"
        : decisionCard
          ? "Karar ayrintisi"
          : null;

  const initials = getSenderInitials(message);

  return (
    <article
      className={`group flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[720px] items-end gap-1.5 ${
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div
          className={`relative shrink-0 ${isOwnMessage ? "mr-0" : "ml-0"}`}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white ${
              message.type === "system"
                ? "bg-blue-500"
                : isOwnMessage
                  ? "bg-slate-700"
                  : "bg-[#202955]"
            }`}
          >
            {message.type === "system" ? <Bot className="h-3 w-3" /> : initials}
          </div>
          {!isOwnMessage && message.type !== "system" ? (
            <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
          ) : null}
        </div>

        <div className="relative pt-1">
          <div
            className={`absolute -top-1 z-10 opacity-0 transition group-hover:opacity-100 ${
              isOwnMessage ? "-left-4" : "-right-4"
            }`}
          >
            <MessageActionMenu onAction={(action) => onAction(message, action)} />
          </div>

          <div
            className={`rounded-[16px] border shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${
              message.type === "system"
                ? "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50"
                : isOwnMessage
                  ? "border-blue-100 bg-gradient-to-br from-white via-blue-50/80 to-blue-100/80"
                  : "border-white/80 bg-white/96"
            } ${
              hasInteractiveCard ? "px-3 py-2" : "px-3 py-2.5"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[11px] font-medium text-slate-900">
                    {message.sender.name}
                  </p>
                  {message.sender.role ? (
                    <span className="truncate text-[10px] text-slate-500">
                      / {message.sender.role}
                    </span>
                  ) : null}
                  {message.isPinned ? (
                    <Pin className="h-3 w-3 shrink-0 text-blue-600" />
                  ) : null}
                </div>

                <p className="mt-1 text-[11px] leading-[16px] text-slate-700">
                  {message.content}
                </p>

                {hasInteractiveCard && detailLabel ? (
                  <div className="mt-2 rounded-[14px] border border-slate-200/90 bg-white/88 px-2.5 py-2">
                    <button
                      type="button"
                      onClick={() => setDetailsOpen((current) => !current)}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <Clock3 className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Etkilesimli kart
                          </p>
                          <p className="truncate text-[11px] font-medium text-slate-700">
                            {detailLabel}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-white p-1 text-slate-500">
                        {detailsOpen ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </button>

                    {detailsOpen ? (
                      <div className="mt-2">
                        {taskCard ? <TaskMiniCard task={taskCard} /> : null}
                        {reminderCard ? <ReminderMiniCard reminder={reminderCard} /> : null}
                        {shiftCard ? <ShiftMiniCard shift={shiftCard} /> : null}
                        {decisionCard ? <DecisionCard decision={decisionCard} /> : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-1.5 flex justify-end">
                  <span className="text-[10px] font-medium text-slate-400">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
