"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { filterActivity, sortNewestFirst } from "@/lib/activity";
import { getErrorMessage, requestJson } from "@/lib/clientApi";
import type { ActivityLog } from "@/types/api";

export function useActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [query, setQuery] = useState("");
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

  // Derived from activities and query, so they are calculated, not kept in state.
  const sortedActivities = useMemo(() => sortNewestFirst(activities), [activities]);
  const visibleActivities = useMemo(
    () => filterActivity(sortedActivities, query),
    [sortedActivities, query]
  );

  return {
    activities,
    visibleActivities,
    query,
    loading,
    error,
    setQuery,
    fetchActivity,
  };
}
