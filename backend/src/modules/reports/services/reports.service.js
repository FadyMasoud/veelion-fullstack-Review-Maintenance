const tasksService = require('../../tasks/services/tasks.service');
const activityService = require('../../activity/services/activity.service');

const TASK_STATUSES = ['todo', 'in-progress', 'done'];
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Tasks only store `completed` today, so in-progress is always 0. If tasks
// ever get a real `status` field, it is used first and the report keeps working.
function getTaskStatus(task) {
  if (TASK_STATUSES.includes(task.status)) {
    return task.status;
  }

  return task.completed ? 'done' : 'todo';
}

function countTasksByStatus(tasks) {
  const counts = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0]));

  for (const task of tasks) {
    counts[getTaskStatus(task)] += 1;
  }

  return counts;
}

// Entries with a missing or invalid date are not counted.
function countRecentActivity(activities, days, now) {
  const since = now - days * DAY_IN_MS;

  return activities.filter((activity) => {
    const time = Date.parse(activity.when);
    return !Number.isNaN(time) && time >= since;
  }).length;
}

async function getTasksSummary({ recentDays }) {
  const [tasks, activities] = await Promise.all([
    tasksService.getAllTasks(),
    activityService.getAllActivity(),
  ]);

  return {
    total: tasks.length,
    byStatus: countTasksByStatus(tasks),
    recentActivityCount: countRecentActivity(activities, recentDays, Date.now()),
  };
}

module.exports = {
  getTasksSummary,
};
