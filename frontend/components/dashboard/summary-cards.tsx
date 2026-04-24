"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

type DashboardSummary = {
  activeStaff: number;
  todaysAssignments: number;
  pendingApprovals: number;
  unreadNotifications: number;
};

type CardProps = {
  label: string;
  value: number;
};

function MetricCard({ label, value }: CardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}

export function SummaryCards() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.get<DashboardSummary>("/dashboard/summary/");
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load summary.");
      }
    };

    void load();
  }, []);

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!summary) {
    return <p>Loading dashboard metrics...</p>;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Active Staff" value={summary.activeStaff} />
      <MetricCard label="Today Assignments" value={summary.todaysAssignments} />
      <MetricCard label="Pending Approvals" value={summary.pendingApprovals} />
      <MetricCard label="Unread Notifications" value={summary.unreadNotifications} />
    </section>
  );
}
