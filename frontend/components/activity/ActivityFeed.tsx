"use client";

import { useActivity } from "@/hooks/useActivity";
import { ActivityList } from "@/components/activity/ActivityList";
import { ActivitySearch } from "@/components/activity/ActivitySearch";

export function ActivityFeed() {
  const { activities, visibleActivities, query, loading, error, setQuery, fetchActivity } = useActivity();

  const emptyMessage =
    activities.length === 0 ? "No activity yet." : `No activity matches "${query.trim()}".`;

  return (
    <section className="stack">
      <header className="card" style={{ padding: "1rem" }}>
        <h1 style={{ margin: 0 }}>Activity Feed</h1>
      </header>

      <ActivitySearch value={query} onChange={setQuery} />

      {loading ? (
        <section className="card" style={{ padding: "1rem" }}>
          <p style={{ margin: 0 }}>Loading activity...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card" style={{ padding: "1rem", borderColor: "#e3b4c0", background: "#fff8fa" }}>
          <p style={{ marginTop: 0, marginBottom: "0.75rem", color: "var(--danger)" }}>{error}</p>
          <button type="button" className="button" onClick={fetchActivity}>
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="card" style={{ padding: "1rem" }}>
            <small style={{ color: "var(--muted)" }}>
              Total: {activities.length} | Visible: {visibleActivities.length}
            </small>
          </section>

          <ActivityList activities={visibleActivities} emptyMessage={emptyMessage} />
        </>
      ) : null}
    </section>
  );
}
