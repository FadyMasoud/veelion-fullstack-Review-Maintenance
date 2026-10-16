"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/clientApi";
import { RECENT_ACTIVITY_DAYS } from "@/lib/reports";
import type { TasksSummary } from "@/types/api";

export function useTasksSummary() {
  const [summary, setSummary] = useState<TasksSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await requestJson<TasksSummary>(
        `/api/reports/tasks-summary?days=${RECENT_ACTIVITY_DAYS}`
      );
      setSummary(data);
    } catch (error) {
      setError(getErrorMessage(error, "Could not load the report right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, fetchSummary };
}
