import type { TaskStatus } from "@/types/api";

// The page asks the API for this window and uses the same value in its labels,
// so the number and the text can't disagree.
export const RECENT_ACTIVITY_DAYS = 7;

// Display order and labels for each status the API returns.
export const TASK_STATUS_LABELS: Array<{ status: TaskStatus; label: string }> = [
  { status: "todo", label: "To do" },
  { status: "in-progress", label: "In progress" },
  { status: "done", label: "Done" },
];

export function toPercent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
