"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useTasks } from "@/hooks/useTasks";
import type { Task, TaskFilter } from "@/types/api";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { buildTaskColumns } from "@/components/tasks/taskColumns";
import styles from "./TaskDashboard.module.css";

export function TaskDashboard() {
  const {
    tasks,
    loading,
    loadError,
    updateError,
    savingTaskIds,
    fetchTasks,
    updateTaskStatus,
    clearUpdateError,
  } = useTasks();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskFilter>("all");

  const handleToggle = useCallback(
    (task: Task) => updateTaskStatus(task.id, !task.completed),
    [updateTaskStatus]
  );

  const columns = useMemo(
    () => buildTaskColumns({ savingTaskIds, onToggle: handleToggle }),
    [savingTaskIds, handleToggle]
  );

  const columnFilters = useMemo<ColumnFiltersState>(
    () => (statusFilter === "all" ? [] : [{ id: "status", value: statusFilter }]),
    [statusFilter]
  );

  const completedCount = tasks.filter((task) => task.completed).length;
  const isFiltered = search.trim() !== "" || statusFilter !== "all";

  return (
    <div className="stack">
      <PageHeader
        title="Tasks"
        description={loading ? "Loading tasks..." : `${tasks.length} tasks · ${completedCount} completed`}
      />

      {updateError ? (
        <div role="alert" className="notice-error">
          <p>{updateError}</p>
          <button type="button" className="button" onClick={clearUpdateError}>
            Dismiss
          </button>
        </div>
      ) : null}

      <section className={`card ${styles.panel}`}>
        <div className={styles.toolbar}>
          <SearchInput
            id="task-search"
            label="Search tasks"
            placeholder="Search by title"
            value={search}
            onChange={setSearch}
          />
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        </div>

        {loading ? (
          <p className={styles.state} aria-busy="true">
            Loading tasks...
          </p>
        ) : null}

        {!loading && loadError ? (
          <div className={styles.state}>
            <div role="alert" className="notice-error">
              <p>{loadError}</p>
              <button type="button" className="button" onClick={fetchTasks}>
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {!loading && !loadError ? (
          <DataTable
            data={tasks}
            columns={columns}
            getRowId={(task) => task.id}
            caption="Tasks"
            emptyMessage={isFiltered ? "No tasks match your search or filter." : "No tasks yet."}
            globalFilter={search.trim()}
            columnFilters={columnFilters}
            initialSorting={[{ id: "updatedAt", desc: true }]}
          />
        ) : null}
      </section>
    </div>
  );
}
