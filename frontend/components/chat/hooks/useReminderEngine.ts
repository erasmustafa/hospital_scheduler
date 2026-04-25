"use client";

import { useMemo, useState } from "react";
import type { Reminder } from "@/types/reminder";

const INITIAL_REMINDERS: Reminder[] = [
  {
    id: "rem-1",
    title: "Sabah nöbet devir notlarını paylaş",
    remindAt: "2026-04-26T07:45:00",
    targetUserIds: ["u-1"],
    targetNames: ["Mustafa Bedir"],
    departmentId: "er",
    priority: "high",
  },
  {
    id: "rem-2",
    title: "Yoğun bakım yatak doluluk güncellemesi",
    remindAt: "2026-04-26T10:30:00",
    targetUserIds: ["u-2", "u-3"],
    targetNames: ["Elif Ömercik", "Ahmet Soylu"],
    departmentId: "icu",
    priority: "normal",
  },
];

export default function useReminderEngine() {
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS);

  const createReminder = (reminder: Reminder) => {
    setReminders((current) => [reminder, ...current]);
  };

  const updateReminder = (id: string, patch: Partial<Reminder>) => {
    setReminders((current) =>
      current.map((reminder) => (reminder.id === id ? { ...reminder, ...patch } : reminder))
    );
  };

  const completeReminder = (id: string) => {
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
  };

  const snoozeReminder = (id: string, nextDate: string) => {
    updateReminder(id, { remindAt: nextDate });
  };

  const upcomingReminders = useMemo(
    () =>
      [...reminders].sort(
        (left, right) => new Date(left.remindAt).getTime() - new Date(right.remindAt).getTime()
      ),
    [reminders]
  );

  return {
    reminders,
    upcomingReminders,
    createReminder,
    updateReminder,
    completeReminder,
    snoozeReminder,
  };
}
