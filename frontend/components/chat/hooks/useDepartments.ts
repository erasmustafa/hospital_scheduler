"use client";

import { useMemo, useState } from "react";
import type { Department } from "@/types/department";

const MOCK_DEPARTMENTS: Department[] = [
  {
    id: "surgery",
    name: "Ameliyathane",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    onlineCount: 12,
    description: "Operasyon hazırlıkları ve vaka koordinasyonu",
  },
  {
    id: "icu",
    name: "Yoğun Bakım",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    onlineCount: 9,
    description: "Kritik hasta takibi ve günlük vardiya paylaşımı",
  },
  {
    id: "er",
    name: "Acil Servis",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    onlineCount: 16,
    description: "Acil hasta akışı ve anlık görev koordinasyonu",
  },
  {
    id: "clinic",
    name: "Poliklinik",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    onlineCount: 7,
    description: "Randevu ve hekim odaklı koordinasyon",
  },
];

export default function useDepartments() {
  const [activeDepartmentId, setActiveDepartmentId] = useState<string | null>(null);

  const activeDepartment = useMemo(
    () => MOCK_DEPARTMENTS.find((department) => department.id === activeDepartmentId) ?? null,
    [activeDepartmentId]
  );

  return {
    departments: MOCK_DEPARTMENTS,
    activeDepartment,
    activeDepartmentId,
    setActiveDepartmentId,
  };
}
