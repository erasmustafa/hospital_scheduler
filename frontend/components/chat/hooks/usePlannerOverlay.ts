"use client";

import { useMemo, useState } from "react";
import type { PlannerItem } from "@/types/chat";

const INITIAL_PLANNER_ITEMS: PlannerItem[] = [
  {
    id: "plan-1",
    title: "Acil servis sabah teslimi",
    type: "shift",
    start: "2026-04-26T08:00:00",
    end: "2026-04-26T08:30:00",
    departmentId: "er",
    assignedTo: "Ekip Lideri",
  },
  {
    id: "plan-2",
    title: "İzin taleplerini gözden geçir",
    type: "task",
    start: "2026-04-26T10:00:00",
    end: "2026-04-26T10:45:00",
    departmentId: "surgery",
    assignedTo: "Mustafa Bedir",
  },
  {
    id: "plan-3",
    title: "Vardiya değişim hatırlatması",
    type: "reminder",
    start: "2026-04-26T13:30:00",
    departmentId: "icu",
    assignedTo: "Elif Ömercik",
  },
];

export default function usePlannerOverlay() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState("2026-04-26");
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>(INITIAL_PLANNER_ITEMS);

  const openPlanner = () => setIsOpen(true);
  const closePlanner = () => setIsOpen(false);

  const todaysItems = useMemo(
    () =>
      plannerItems.filter((item) => item.start.slice(0, 10) === selectedDate),
    [plannerItems, selectedDate]
  );

  const addPlannerItem = (item: PlannerItem) => {
    setPlannerItems((current) => [item, ...current]);
  };

  return {
    isOpen,
    openPlanner,
    closePlanner,
    selectedDate,
    setSelectedDate,
    plannerItems,
    todaysItems,
    addPlannerItem,
  };
}
