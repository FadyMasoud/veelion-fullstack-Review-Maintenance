import type { TaskFilter } from "@/types/api";
import styles from "./StatusFilter.module.css";

const FILTERS: Array<{ label: string; value: TaskFilter }> = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];

type StatusFilterProps = {
  value: TaskFilter;
  onChange: (value: TaskFilter) => void;
};

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div role="group" aria-label="Filter tasks by status" className={styles.group}>
      {FILTERS.map((filter) => {
        const active = filter.value === value;

        return (
          <button
            key={filter.value}
            type="button"
            className={`${styles.option} ${active ? styles.active : ""}`}
            onClick={() => onChange(filter.value)}
            aria-pressed={active}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
