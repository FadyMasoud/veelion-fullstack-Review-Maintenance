# Task Manager: VeeLion Full-Stack Assessment

A small task management app: an Express.js API that stores its data in JSON files, and a Next.js (App Router, TypeScript) web app.

- **Tasks**: a sortable, searchable, paginated table. Filter by status and mark tasks done or pending.
- **Activity**: the activity log as a table, newest first, with search and an action filter.
- **Reports**: total tasks, tasks by status and recent activity, from `GET /reports/tasks-summary`.
- Shared layout with a sidebar, header and footer, and a light/dark theme.

The code review is in [REVIEW.md](REVIEW.md).

## Running it

You need Node.js 18.17 or newer.

**1. Backend** (runs on http://localhost:4000)

```bash
cd backend
npm install
npm start
```

**2. Frontend** (runs on http://localhost:3000)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Then open http://localhost:3000.

The backend used to default to port 3000, the same port as `next dev`, while the frontend config and docs pointed to 4000. It now defaults to 4000 so the two match. `PORT=... npm start` still works.

## Project structure

```
backend/
  data/                 tasks.json and activity.json (the storage)
  src/
    config/paths.js     data file paths, built from the code's location
    utils/jsonStore.js  reading and locked, atomic updates of the JSON files
    modules/
      tasks/            routes → controller → service (+ validator)
      activity/         same structure
      reports/          GET /reports/tasks-summary
frontend/
  app/                  pages and API routes (the API routes call the backend)
  components/
    layout/             sidebar, header, footer, theme toggle
    ui/                 DataTable, PageHeader, SearchInput
    tasks/ activity/ reports/
  hooks/                useTasks, useActivity, useTasksSummary
  lib/                  API helpers, dates, report constants
  docs/backend-endpoints.md
```

The browser only talks to the Next.js API routes (`/api/...`). They call the Express API on the server, so there is no CORS setup and the backend address stays on the server.

## Reports API

`GET /reports/tasks-summary?days=7`

```json
{ "total": 4, "byStatus": { "todo": 2, "in-progress": 0, "done": 2 }, "recentActivityCount": 3 }
```

- **byStatus**: tasks only store `completed`, so done = completed, todo = not completed, and in-progress is 0. If a task ever has a valid `status` field, that is used instead.
- **recentActivityCount**: activity entries whose `when` is within the last `days` days (default 7, allowed 1–365, anything else is a 400). The page sends the same `days` value it shows in its label.
- The report uses the Tasks and Activity services instead of reading the files itself, so each module stays in charge of its own data.

Full endpoint docs: [frontend/docs/backend-endpoints.md](frontend/docs/backend-endpoints.md).

## Main decisions

- **Safe writes to the JSON files.** Every change goes through `updateJsonArray`, which reads, changes and saves a file inside a per-file lock, and writes to a temp file before renaming it. Before this, two requests at the same time could lose data.
- **Kept the API response shapes** (`{ data }` for tasks, plain arrays and objects for activity and reports), because the frontend and docs rely on them.
- **One reusable table** (`components/ui/DataTable.tsx`) built on TanStack Table. TanStack handles sorting, filtering and paging, and the component renders it with our own markup and styles.
- **Design tokens** in `app/globals.css` (CSS variables) and CSS Modules per component. The dark theme only swaps the variables, and a small inline script applies the saved theme before the first paint so there is no flash.

What I left alone on purpose, and why, is at the end of each half of [REVIEW.md](REVIEW.md).
