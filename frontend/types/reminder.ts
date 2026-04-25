export type ReminderPriority = "low" | "normal" | "high" | "critical";
export type ReminderRepeat = "none" | "daily" | "weekly" | "monthly";

export type Reminder = {
  id: string;
  title: string;
  remindAt: string;
  targetUserIds: string[];
  targetNames?: string[];
  departmentId?: string;
  priority: ReminderPriority;
  sourceMessageId?: string;
  repeat?: ReminderRepeat;
};
