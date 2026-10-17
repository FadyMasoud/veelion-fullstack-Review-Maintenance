import { createColumnHelper } from "@tanstack/react-table";
import { formatFullDate, formatShortDate, toTime } from "@/lib/dates";
import type { Task } from "@/types/api";
import styles from "./TaskDashboard.module.css";

const columnHelper = createColumnHelper<Task>();

type TaskColumnOptions = {
  savingTaskIds: ReadonlySet<string>;
  onToggle: (task: Task) => void;
};

export function buildTaskColumns({ savingTaskIds, onToggle }: TaskColumnOptions) {
  return [
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => <span className={styles.title}>{info.getValue()}</span>,
    }),

    // The value is "completed" or "pending", so the status filter can match it exactly.
    columnHelper.accessor((task) => (task.completed ? "completed" : "pending"), {
      id: "status",
      header: "Status",
      filterFn: "equalsString",
      enableGlobalFilter: false,
      cell: (info) =>
        info.row.original.completed ? (
          <span className="badge badge-success">Completed</span>
        ) : (
          <span className="badge badge-warning">Pending</span>
        ),
    }),

    // Dates sort as numbers; the cell shows a readable date with the full one on hover.
    columnHelper.accessor((task) => toTime(task.createdAt), {
      id: "createdAt",
      header: "Created",
      enableGlobalFilter: false,
      cell: (info) => (
        <time className={styles.date} dateTime={info.row.original.createdAt} title={formatFullDate(info.row.original.createdAt)}>
          {formatShortDate(info.row.original.createdAt)}
        </time>
      ),
    }),

    columnHelper.accessor((task) => toTime(task.updatedAt), {
      id: "updatedAt",
      header: "Updated",
      enableGlobalFilter: false,
      cell: (info) => (
        <time className={styles.date} dateTime={info.row.original.updatedAt} title={formatFullDate(info.row.original.updatedAt)}>
          {formatShortDate(info.row.original.updatedAt)}
        </time>
      ),
    }),

    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const task = row.original;
        const busy = savingTaskIds.has(task.id);

        return (
          <button
            type="button"
            className={`button ${styles.toggle}`}
            onClick={() => onToggle(task)}
            disabled={busy}
            aria-label={`Mark ${task.title} as ${task.completed ? "pending" : "completed"}`}
          >
            {busy ? "Saving..." : task.completed ? "Mark as pending" : "Mark as done"}
          </button>
        );
      },
    }),
  ];
}
