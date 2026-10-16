import { BACKEND_BASE_URL } from "@/lib/constants";
import type {
  ActivityLog,
  ErrorResponse,
  Task,
  TaskResponse,
  TasksResponse,
  TasksSummary,
} from "@/types/api";

// Keeps the backend's HTTP status, so API routes can pass it on to the browser
// instead of turning every failure into a 500.
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error?.message || fallback;
  } catch {
    return fallback;
  }
}

async function requestBackend<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BACKEND_BASE_URL}${path}`, { ...init, cache: "no-store" });
  } catch {
    // fetch only throws when there is no response at all (backend down or unreachable).
    throw new ApiError("Could not reach the backend service.", 502);
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  return (await response.json()) as T;
}

export async function getTasksFromBackend(): Promise<Task[]> {
  const body = await requestBackend<TasksResponse>("/tasks");
  return body.data;
}

export async function updateTaskInBackend(taskId: string, completed: boolean): Promise<Task> {
  const body = await requestBackend<TaskResponse>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ completed }),
  });

  return body.data;
}

export async function getActivityFromBackend(): Promise<ActivityLog[]> {
  return requestBackend<ActivityLog[]>("/activity");
}

// `days` is passed through as-is. The backend validates it and answers 400 if it's wrong.
export async function getTasksSummaryFromBackend(days: string | null): Promise<TasksSummary> {
  const query = days === null ? "" : `?${new URLSearchParams({ days })}`;
  return requestBackend<TasksSummary>(`/reports/tasks-summary${query}`);
}
