"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { RealtimeMessage } from "@/lib/websocket";
import { useWebsocket } from "@/hooks/use-websocket";

export type Assignment = {
  id: number;
  assignmentDate: string;
  status: string;
  staffProfileName: string;
  shiftTypeName: string;
  shiftColor: string;
  departmentName: string;
};

export function useCalendar() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    try {
      const response = await apiClient.get<{ assignments: Assignment[] }>("/assignments/");
      setAssignments(response.assignments);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load assignment calendar."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const handleRealtime = useCallback(
    (message: RealtimeMessage) => {
      if (
        message.type === "assignment.created" ||
        message.type === "assignment.updated" ||
        message.type === "assignment.deleted"
      ) {
        void loadAssignments();
      }
    },
    [loadAssignments]
  );

  useWebsocket({ path: "/schedule/", onMessage: handleRealtime });

  const moveAssignment = useCallback(
    async (assignmentId: number, assignmentDate: string) => {
      try {
        await apiClient.patch(`/assignments/${assignmentId}/`, { assignmentDate });
        await loadAssignments();
        return true;
      } catch {
        return false;
      }
    },
    [loadAssignments]
  );

  return {
    loading,
    error,
    assignments,
    moveAssignment
  };
}
