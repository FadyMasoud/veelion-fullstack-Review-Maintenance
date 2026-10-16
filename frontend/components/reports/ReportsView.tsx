"use client";

import { Activity, ListChecks, RefreshCw } from "lucide-react";
import { useTasksSummary } from "@/hooks/useTasksSummary";
import { RECENT_ACTIVITY_DAYS } from "@/lib/reports";
import { StatTile } from "@/components/reports/StatTile";
import { StatusBreakdown } from "@/components/reports/StatusBreakdown";
import styles from "./ReportsView.module.css";

export function ReportsView() {
  const { summary, loading, error, fetchSummary } = useTasksSummary();

  return (
    <div className="stack">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>A summary of your tasks and recent activity.</p>
        </div>
        <button type="button" className="button" onClick={fetchSummary} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {loading ? (
        <div className={styles.grid} aria-busy="true">
          <p className={styles.loadingText}>Loading report...</p>
          <div className={`card ${styles.skeleton}`} aria-hidden="true" />
          <div className={`card ${styles.skeleton}`} aria-hidden="true" />
          <div className={`card ${styles.skeleton} ${styles.skeletonWide}`} aria-hidden="true" />
        </div>
      ) : null}

      {!loading && error ? (
        <section role="alert" className={`card ${styles.error}`}>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className="button" onClick={fetchSummary}>
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error && summary ? (
        <div className={styles.grid}>
          <StatTile label="Total tasks" value={summary.total} hint="All tasks" icon={ListChecks} />
          <StatTile
            label="Recent activity"
            value={summary.recentActivityCount}
            hint={`Entries in the last ${RECENT_ACTIVITY_DAYS} days`}
            icon={Activity}
          />
          <div className={styles.wide}>
            <StatusBreakdown total={summary.total} byStatus={summary.byStatus} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
