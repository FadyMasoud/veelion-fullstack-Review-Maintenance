"use client";

import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/api";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskList } from "@/components/tasks/TaskList";

export function TaskDashboard() {
  const {
    filteredTasks,
    filter,
    loading,
    loadError,
    updateError,
    savingTaskIds,
    setFilter,
    fetchTasks,
    updateTaskStatus,
    clearUpdateError,
  } = useTasks();

  const handleToggle = (task: Task) => {
    updateTaskStatus(task.id, !task.completed);
  };

  return (
    <section className="stack">
      <header className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Task Dashboard</h1>
      </header>

      <StatusFilter value={filter} onChange={setFilter} />

      {loading ? (
        <section className="card" style={{ padding: "1rem" }}>
          <p style={{ margin: 0 }}>Loading tasks...</p>
        </section>
      ) : null}

      {loadError ? (
        <section className="card" style={{ padding: "1rem", borderColor: "var(--danger-border)", background: "var(--danger-soft)" }}>
          <p style={{ marginTop: 0, marginBottom: "0.75rem", color: "var(--danger)" }}>{loadError}</p>
          <button type="button" className="button" onClick={fetchTasks}>
            Retry
          </button>
        </section>
      ) : null}

      {updateError ? (
        <section
          role="alert"
          className="card"
          style={{ padding: "1rem", borderColor: "var(--danger-border)", background: "var(--danger-soft)" }}
        >
          <p style={{ marginTop: 0, marginBottom: "0.75rem", color: "var(--danger)" }}>{updateError}</p>
          <button type="button" className="button" onClick={clearUpdateError}>
            Dismiss
          </button>
        </section>
      ) : null}

      {!loading && !loadError ? (
        <TaskList tasks={filteredTasks} savingTaskIds={savingTaskIds} onToggle={handleToggle} />
      ) : null}
    </section>
  );
}
