import type { Department } from "@/types/department";
import type { Reminder } from "@/types/reminder";
import type { Task } from "@/types/task";

export type MessageType =
  | "text"
  | "system"
  | "task"
  | "reminder"
  | "decision"
  | "shift";

export type MessageIntent =
  | "task"
  | "reminder"
  | "decision"
  | "shift"
  | "general";

export type MessageAttachment = {
  id: string;
  type: "link" | "file" | "card";
  label: string;
  url?: string;
};

export type ChannelType = "general" | "department" | "private" | "system";

export type MessageSender = {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  initials?: string;
};

export type Message = {
  id: string;
  channelId: string;
  departmentId?: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
  type: MessageType;
  attachments?: MessageAttachment[];
  metadata?: Record<string, unknown>;
  isPinned?: boolean;
};

export type Channel = {
  id: string;
  name: string;
  type: ChannelType;
  unreadCount: number;
  departmentId?: string;
  description?: string;
  memberCount?: number;
  onlineCount?: number;
};

export type PlannerItem = {
  id: string;
  title: string;
  type: "shift" | "task" | "reminder" | "meeting";
  start: string;
  end?: string;
  departmentId?: string;
  assignedTo?: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  tone?: "info" | "success" | "warning";
};

export type ShiftCardItem = {
  id: string;
  staffName: string;
  shiftLabel: string;
  start: string;
  end: string;
  departmentId?: string;
};

export type PinnedDecision = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  ownerName: string;
};

export type ChatSocketEvent =
  | { type: "message.created"; payload: Message }
  | { type: "message.updated"; payload: Message }
  | { type: "message.deleted"; payload: { id: string } }
  | { type: "typing.started"; payload: { userId: string } }
  | { type: "reminder.created"; payload: Reminder }
  | { type: "task.created"; payload: Task };

export type ChatWorkspaceSnapshot = {
  channels: Channel[];
  departments: Department[];
  reminders: Reminder[];
  tasks: Task[];
  plannerItems: PlannerItem[];
};
