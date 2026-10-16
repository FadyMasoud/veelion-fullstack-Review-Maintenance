import { TASK_STATUS_LABELS, toPercent } from "@/lib/reports";
import type { TasksSummary } from "@/types/api";
import styles from "./StatusBreakdown.module.css";

type StatusBreakdownProps = {
  total: number;
  byStatus: TasksSummary["byStatus"];
};

export function StatusBreakdown({ total, byStatus }: StatusBreakdownProps) {
  return (
    <section className={`card ${styles.card}`}>
      <h2 className={styles.title}>Tasks by status</h2>

      {total === 0 ? (
        <p className={styles.empty}>No tasks yet.</p>
      ) : (
        <ul className={styles.list}>
          {TASK_STATUS_LABELS.map(({ status, label }) => {
            const count = byStatus[status];
            const percent = toPercent(count, total);

            return (
              <li key={status} className={styles.row} title={`${label}: ${count} of ${total} tasks (${percent}%)`}>
                <div className={styles.rowText}>
                  <span className={styles.rowLabel}>{label}</span>
                  <span className={styles.rowValue}>
                    {count.toLocaleString()} <span className={styles.percent}>· {percent}%</span>
                  </span>
                </div>
                {/* The numbers above carry the value; the bar is only a visual aid. */}
                <div className={styles.track} aria-hidden="true">
                  <div className={styles.fill} style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.note}>
        Tasks only store done or not done today, so &quot;In progress&quot; stays at 0 until tasks have a status.
      </p>
    </section>
  );
}
