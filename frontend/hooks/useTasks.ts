"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/clientApi";
import type { Task, TaskResponse, TasksResponse } from "@/types/api";

// Loads and updates tasks. Searching, filtering and sorting happen in the table.
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Loading errors replace the list. Update errors are shown above it, so one
  // failed toggle doesn't hide every task.
  const [loadError, setLoadError] = useState<string>("");
  const [updateError, setUpdateError] = useState<string>("");
  const [savingTaskIds, setSavingTaskIds] = useState<ReadonlySet<string>>(() => new Set());

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const body = await requestJson<TasksResponse>("/api/tasks", {
        method: "GET",
      });

      setTasks(body.data);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Could not load tasks right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, completed: boolean) => {
    // A Set so several tasks can be saving at the same time.
    setSavingTaskIds((previous) => new Set(previous).add(taskId));
    setUpdateError("");

    try {
      const body = await requestJson<TaskResponse>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });

      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? body.data : task))
      );
    } catch (error) {
      setUpdateError(getErrorMessage(error, "Could not update task status."));
    } finally {
      setSavingTaskIds((previous) => {
        const next = new Set(previous);
        next.delete(taskId);
        return next;
      });
    }
  }, []);

  const clearUpdateError = useCallback(() => setUpdateError(""), []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    loadError,
    updateError,
    savingTaskIds,
    fetchTasks,
    updateTaskStatus,
    clearUpdateError,
  };
}
