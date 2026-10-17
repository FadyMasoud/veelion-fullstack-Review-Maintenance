"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/clientApi";
import type { ActivityLog } from "@/types/api";

// Loads the activity log. Searching, filtering and sorting happen in the table.
export function useActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await requestJson<ActivityLog[]>("/api/activity");
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from the server.");
      }

      setActivities(data);
    } catch (error) {
      setError(getErrorMessage(error, "Could not load activity right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return {
    activities,
    loading,
    error,
    fetchActivity,
  };
}
