"use client";

import { useMemo, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useActivity } from "@/hooks/useActivity";
import { activityColumns } from "@/components/activity/activityColumns";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import styles from "./ActivityFeed.module.css";

const ALL_ACTIONS = "";

export function ActivityFeed() {
  const { activities, loading, error, fetchActivity } = useActivity();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState(ALL_ACTIONS);

  // The options for the action dropdown come from the data itself.
  const actionOptions = useMemo(
    () => Array.from(new Set(activities.map((item) => item.action).filter(Boolean) as string[])).sort(),
    [activities]
  );

  const columnFilters = useMemo<ColumnFiltersState>(
    () => (actionFilter === ALL_ACTIONS ? [] : [{ id: "action", value: actionFilter }]),
    [actionFilter]
  );

  const isFiltered = search.trim() !== "" || actionFilter !== ALL_ACTIONS;

  return (
    <div className="stack">
      <PageHeader
        title="Activity"
        description={loading ? "Loading activity..." : `${activities.length} entries in the log`}
      />

      <section className={`card ${styles.panel}`}>
        <div className={styles.toolbar}>
          <SearchInput
            id="activity-search"
            label="Search activity"
            placeholder="Search action or info"
            value={search}
            onChange={setSearch}
          />

          <div className={styles.filter}>
            <label htmlFor="activity-action-filter" className={styles.filterLabel}>
              Action
            </label>
            <select
              id="activity-action-filter"
              className={`input ${styles.select}`}
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              <option value={ALL_ACTIONS}>All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className={styles.state} aria-busy="true">
            Loading activity...
          </p>
        ) : null}

        {!loading && error ? (
          <div className={styles.state}>
            <div role="alert" className="notice-error">
              <p>{error}</p>
              <button type="button" className="button" onClick={fetchActivity}>
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {!loading && !error ? (
          <DataTable
            data={activities}
            columns={activityColumns}
            getRowId={(item) => item.id}
            caption="Activity log"
            emptyMessage={isFiltered ? "No activity matches your search or filter." : "No activity yet."}
            globalFilter={search.trim()}
            columnFilters={columnFilters}
            initialSorting={[{ id: "when", desc: true }]}
          />
        ) : null}
      </section>
    </div>
  );
}
