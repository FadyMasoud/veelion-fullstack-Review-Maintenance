import { createColumnHelper } from "@tanstack/react-table";
import { formatFullDate, formatRelativeTime, toTime } from "@/lib/dates";
import type { ActivityLog } from "@/types/api";
import styles from "./ActivityFeed.module.css";

const columnHelper = createColumnHelper<ActivityLog>();

// action and info are optional, so they fall back to "" for searching and sorting.
export const activityColumns = [
  columnHelper.accessor((item) => item.action ?? "", {
    id: "action",
    header: "Action",
    filterFn: "equalsString",
    cell: (info) =>
      info.getValue() ? (
        <span className={styles.action}>{info.getValue()}</span>
      ) : (
        <span className="muted">(no action)</span>
      ),
  }),

  columnHelper.accessor((item) => item.info ?? "", {
    id: "info",
    header: "Info",
    cell: (info) => info.getValue() || <span className="muted">(no info)</span>,
  }),

  columnHelper.accessor((item) => toTime(item.when), {
    id: "when",
    header: "When",
    enableGlobalFilter: false,
    cell: (info) => (
      <time
        className="muted"
        dateTime={info.row.original.when}
        title={formatFullDate(info.row.original.when)}
      >
        {formatRelativeTime(info.row.original.when)}
      </time>
    ),
  }),
];
