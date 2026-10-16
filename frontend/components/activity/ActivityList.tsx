import { formatFullDate, formatRelativeTime } from "@/lib/activity";
import type { ActivityLog } from "@/types/api";

type ActivityListProps = {
  activities: ActivityLog[];
  emptyMessage: string;
};

export function ActivityList({ activities, emptyMessage }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <section className="card" style={{ padding: "1rem" }}>
        <p style={{ margin: 0, color: "var(--muted)" }}>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="card" aria-label="Activity list" style={{ padding: "1rem" }}>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.7rem" }}>
        {activities.map((item) => (
          <li key={item.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.6rem" }}>
            <div style={{ fontWeight: 600 }}>{item.action || "(no action)"}</div>
            <div>{item.info || "(no info)"}</div>
            <small style={{ color: "var(--muted)" }}>
              <time dateTime={item.when} title={formatFullDate(item.when)}>
                {formatRelativeTime(item.when)}
              </time>
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
