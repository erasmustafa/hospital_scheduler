"use client";

import { useMemo, useState } from "react";
import type { Message, PinnedDecision } from "@/types/chat";
import type { Reminder } from "@/types/reminder";
import type { Task } from "@/types/task";

const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Elif izin talebini kontrol et",
    assigneeName: "Mustafa Bedir",
    departmentId: "surgery",
    dueDate: "2026-04-26T14:00:00",
    priority: "high",
    status: "in_progress",
  },
  {
    id: "task-2",
    title: "Gece vardiyası ek personel ihtiyacını doğrula",
    assigneeName: "Ahmet Soylu",
    departmentId: "er",
    dueDate: "2026-04-26T18:30:00",
    priority: "normal",
    status: "todo",
  },
];

const INITIAL_DECISIONS: PinnedDecision[] = [
  {
    id: "dec-1",
    title: "Cuma günü iki personel fazla mesaide kalacak",
    summary: "Yoğunluk nedeniyle ameliyathane ekibi genişletildi.",
    createdAt: "2026-04-26T09:10:00",
    ownerName: "Merve Aksoy",
  },
];

export default function useMessageActions() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [pinnedDecisions, setPinnedDecisions] = useState<PinnedDecision[]>(INITIAL_DECISIONS);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);

  const createTaskFromMessage = (message: Message, departmentId?: string) => {
    const task: Task = {
      id: `task-${Date.now()}`,
      title: message.content.slice(0, 72),
      assigneeName: "Atanmadı",
      departmentId,
      dueDate: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      priority: "normal",
      status: "todo",
      sourceMessageId: message.id,
    };
    setTasks((current) => [task, ...current]);
    return task;
  };

  const createReminderFromMessage = (message: Message, departmentId?: string) => {
    const reminder: Reminder = {
      id: `rem-${Date.now()}`,
      title: message.content.slice(0, 80),
      remindAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      targetUserIds: [message.sender.id],
      targetNames: [message.sender.name],
      departmentId,
      priority: "normal",
      sourceMessageId: message.id,
      repeat: "none",
    };
    return reminder;
  };

  const addMessageToAgenda = (message: Message) => ({
    id: `agenda-${Date.now()}`,
    title: message.content.slice(0, 60),
    type: "meeting" as const,
    start: new Date().toISOString(),
    assignedTo: message.sender.name,
  });

  const markAsDecision = (message: Message) => {
    const decision: PinnedDecision = {
      id: `dec-${Date.now()}`,
      title: message.content.slice(0, 68),
      summary: "Mesajdan alınan operasyonel karar kaydı",
      createdAt: new Date().toISOString(),
      ownerName: message.sender.name,
    };
    setPinnedDecisions((current) => [decision, ...current]);
    return decision;
  };

  const pinMessage = (messageId: string) => {
    setPinnedMessageIds((current) =>
      current.includes(messageId) ? current : [messageId, ...current]
    );
  };

  const addTask = (task: Task) => {
    setTasks((current) => [task, ...current]);
  };

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status === "todo" || task.status === "in_progress"),
    [tasks]
  );

  return {
    tasks,
    openTasks,
    pinnedDecisions,
    pinnedMessageIds,
    createTaskFromMessage,
    createReminderFromMessage,
    addMessageToAgenda,
    markAsDecision,
    pinMessage,
    addTask,
  };
}
