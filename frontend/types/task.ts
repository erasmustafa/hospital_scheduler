export type TaskPriority = "low" | "normal" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";

export type Task = {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  departmentId?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  sourceMessageId?: string;
};
