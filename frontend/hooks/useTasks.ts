"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ErrorResponse, Task, TaskFilter, TaskResponse, TasksResponse } from "@/types/api";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// If the error body isn't the JSON we expect (for example an HTML error page),
// show a simple message instead of a JSON parser error.
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status}).`;

  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error?.message || fallback;
  } catch {
    return fallback;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error("Could not connect. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as T;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
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

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }

    if (filter === "pending") {
      return tasks.filter((task) => !task.completed);
    }

    return tasks;
  }, [tasks, filter]);

  return {
    tasks,
    filteredTasks,
    filter,
    loading,
    loadError,
    updateError,
    savingTaskIds,
    setFilter,
    fetchTasks,
    updateTaskStatus,
    clearUpdateError,
  };
}
