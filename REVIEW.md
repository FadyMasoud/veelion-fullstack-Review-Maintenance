# Code Review

For every finding I wrote where it is, what the code does now, what the problem is, and how I would fix it.
Severity is High, Medium or Low.

---

# Backend

## Good things I kept

- The folder structure is clear. Every module has routes, controllers and services, so it is easy to find things.
- Errors go through one place (asyncHandler + errorHandler). A 500 error does not show internal details to the user, and it gets logged on the server.
- The HttpError class makes it easy for a service to throw a 404 or 400 with a message.
- The Tasks module reads and writes files with fs/promises, so it does not block the server.
- taskValidator.js is actually well written. It trims the title and rejects unknown fields. The problem is that nothing uses it (see Maintainability 1).

---

## Bugs

### 1. Two requests at the same time can lose data (High)

Where: `src/modules/tasks/services/tasks.service.js` lines 49-53, 67-82, 88-96

Now: every change reads the whole file, changes the array in memory, then writes the whole file back. Nothing stops two requests from doing this at the same time.

Problem: if two users add a task at the same moment, both read the same old list, and the second write replaces the first one. Both users get 201 Created but one task is gone and there is no error anywhere. I tested it by sending 20 POST /tasks at the same time and only 19 were saved.

The Activity module doesn't lose data today, but only because its sync file calls block the whole server, so requests run one by one (see Performance 1). As soon as it is made async it has the same problem, so it needs the same lock.

Fix: add a simple lock per file inside jsonStore.js so writes to the same file wait for each other. I would add one function like `updateJsonArray(filePath, updateFn)` that does read, change and write inside the lock, so a service can't forget to use it. This can be written by hand in a few lines with a promise queue. The `async-mutex` package does the same thing if we want a library. If more than one server process ever uses the same files, an in-memory lock is not enough and something like `proper-lockfile` is needed.

### 2. PATCH lets the client change any field, even the id (High)

Where: `src/modules/tasks/controllers/tasks.controller.js` line 70 and `src/modules/tasks/services/tasks.service.js` lines 75-79

Now: the controller checks title and completed, but then sends the whole request body to the service. The service merges it with `{ ...existingTask, ...updates }`.

Problem: a request like `PATCH /tasks/123` with `{ "completed": true, "id": "abc", "createdAt": "2000-01-01" }` is accepted. The id changes, so the task can't be found by its old id anymore, and the created date is fake. The client can also save any extra fields it wants into the file. I tested it and after the request GET /tasks/123 returns "Task not found".

Fix: only copy allowed fields. taskValidator.js already does this, it rejects unknown fields and returns a clean object, so we just need to use it.

### 3. If the server stops while saving, the file can break (Medium)

Where: `src/utils/jsonStore.js` line 23

Now: writeJsonArray uses fs.writeFile, which empties the file first and then writes the new content.

Problem: if the server crashes or gets stopped in the middle, the file is left empty or half written. After that every request that reads it returns 500.

Fix: write to a temp file first (for example tasks.json.tmp) then use fs.rename to replace the real file. Rename either happens fully or not at all, so the real file is never half written. The `write-file-atomic` package does the same thing.

### 4. The data path depends on where you start the server from (Medium)

Where: `src/modules/tasks/services/tasks.service.js` line 7 and `src/modules/activity/services/activity.service.js` line 4

Now: the paths are built with `process.cwd()`, which is the folder you ran the command from, not the folder where the code is.

Problem: `npm start` inside backend works fine. But running `node backend/src/server.js` from the repo root makes it look for data in the wrong folder, and every request returns 500. I tested this too.

Fix: build the path from `__dirname` in one small config file and use it in all modules, including the new Reports module.

### 5. Activity ids can be duplicated (Low)

Where: `src/modules/activity/services/activity.service.js` line 40

Now: the id is `String(Date.now())`, which is the current time in milliseconds.

Problem: two activities created in the same millisecond would get the same id. I couldn't make it happen locally because the sync file calls make requests run one after another, but once the module is async it becomes possible. The frontend uses these ids as React keys so they need to be unique.

Fix: use `createId()` from `utils/id.js`, which already exists and uses randomUUID.

### 6. Create and update have different title rules (Low)

Where: `src/modules/tasks/controllers/tasks.controller.js` lines 26-29 and `src/modules/tasks/services/tasks.service.js` line 59

Now: creating a task with a one letter title like "A" works, but updating a title to one letter fails with "Title is too short".

Problem: the rules don't match, so a user can create a task with a title they are not allowed to set again.

Fix: keep one title rule in taskValidator.js and use it for both create and update.

---

## Performance

### 1. The Activity module blocks the whole server (Medium)

Where: `src/modules/activity/services/activity.service.js` lines 7, 8, 11, 20, 21, 24 and 47

Now: it uses readFileSync, writeFileSync and existsSync.

Problem: Node runs on one thread. While a sync file call is running the server can't answer any other request, and the bigger the file gets the longer everyone waits.

Fix: use the async functions from jsonStore.js like the Tasks module does.

### 2. Every request reads the whole file (Low)

Where: `src/utils/jsonStore.js` lines 3-24, used by every service function

Now: every GET reads and parses the full file and every change rewrites the full file.

Problem: with thousands of tasks this gets slow. At the size of this project it's not a real problem.

Fix: an in-memory cache that gets updated on every write would remove most of the disk reads (lowdb works this way). I left this alone on purpose. The brief says to keep using the JSON files, and a cache adds more code for no real benefit at this size. If the data really grows, the right fix is a real database like SQLite or PostgreSQL.

### 3. No pagination (Low)

Where: `src/modules/tasks/controllers/tasks.controller.js` line 3 (listTasks) and `src/modules/activity/controllers/activity.controller.js` line 3 (get_activity)

Now: both endpoints always return everything.

Problem: the activity log only grows, so the response gets bigger and slower over time.

Fix: support `?limit=` and `?offset=`. I didn't add it because the frontend expects the full list and it would change how the API works.

---

## Security

### 1. Activity accepts anything (Medium)

Where: `src/modules/activity/services/activity.service.js` lines 41-42 and `src/modules/activity/controllers/activity.controller.js` lines 9-10

Now: POST /activity saves action and info without checking them. They can be missing, numbers, objects or a very long string.

Problem: anyone who can reach the API can fill the log with junk or huge entries, and then the frontend and the reports can't trust the data.

Fix: require action and info to be strings, trim them and limit their length, same idea as taskValidator.js. Libraries like `zod` or `joi` can do this with a schema, but for two small modules a small hand-written validator is enough.

### 2. No security headers or rate limit (Low)

Where: `src/app.js` lines 8-10

Now: the app only adds express.json. There are no security headers and no limit on how many requests one client can send.

Problem: one client can send unlimited requests, and each one rewrites a file on disk.

Fix: add `helmet` for security headers and `express-rate-limit` for a request limit. Low priority because the API is meant to be called by the Next.js server, not directly from the internet.

### 3. Dependencies with known security issues (Medium)

Where: `package-lock.json` (packages that come with Express: `proxy-addr`, `body-parser`, `qs`)

Now: `npm audit` reports 3 issues, one of them critical (`proxy-addr`, IP spoofing).

Problem: these are publicly known issues, and any security scan will flag them.

Fix: run `npm audit fix`. It only updates these packages to fixed versions inside the same Express 4 range, so nothing in our code has to change.

---

## Maintainability

### 1. Task validation is written three times, and the good version is not used (Medium)

Where: `src/modules/tasks/controllers/tasks.controller.js` lines 14-37 and 45-68, `src/modules/tasks/services/tasks.service.js` lines 37-47 and 59-65, and `src/modules/tasks/utils/taskValidator.js` (never imported)

Now: the same checks are in the controller, again in the service, and a third time in taskValidator.js which nothing imports.

Problem: if a rule changes it has to be changed in three places, and they already don't agree (see Bugs 6). The error messages are also all different, for example "bad body type", "completed should be bool" and "Invalid title.".

Fix: use taskValidator.js in the controller, remove the inline checks, and let the service only deal with data.

### 2. The Activity module doesn't follow the rest of the project (Medium)

Where: `src/modules/activity/` (all three files)

Now: Tasks uses jsonStore, asyncHandler and HttpError. Activity uses none of them and talks to fs directly.

Problem: two ways of doing the same thing in a small codebase. Every fix, like the lock or the safe write, would have to be done twice.

Fix: move Activity onto jsonStore and asyncHandler. I would keep its response shape (a plain array, not `{ data }`) because the frontend and the docs depend on it.

---

## Code quality

### 1. Names that don't explain anything (Low)

Where: `activity.controller.js` lines 1, 3, 4, 9, 10, `activity.routes.js` line 3, `activity.service.js` lines 4, 6, 19, 37, 39

Now: names like `aSvc`, `c`, `x`, `b`, `one`, `made`, `fp`, `loadDataA`, `loadDataB`, and `get_activity` which is snake_case while the rest of the project is camelCase.

Problem: you have to read the code around a variable to understand what it holds.

Fix: rename to things like activityService, activityController, activities, payload, newActivity, ACTIVITY_FILE_PATH and listActivity.

### 2. Two copies of the same function (Low)

Where: `src/modules/activity/services/activity.service.js` lines 6-17 and 19-30

Now: loadDataA and loadDataB are exactly the same.

Fix: delete both and use readJsonArray from jsonStore.

---

## Things I left alone on purpose

- The response shapes. Tasks return `{ data }` and activity returns a plain array. It's inconsistent, but the frontend and the docs depend on it and changing it would break something that works today.
- JSON files for storage. The brief asks for it. A real database is the long term fix (see Performance 2).
- Caching and pagination (Performance 2 and 3). Not needed at this size and they would change behaviour the frontend relies on.
- Security headers and rate limiting (Security 2). Worth adding before the API is exposed to the internet, but today it is only called by the Next.js server, so I kept the change set focused.
- One moderate `qs` advisory is still reported after `npm audit fix`. Express 4 pins its own copy of `qs`, so it can only go away with an Express upgrade. The issue is in `qs` options that Express doesn't use.
- `in-progress` in the report is always 0, because tasks only store `completed`. I didn't add a `status` field to tasks, because that would change the task model, the stored data and the frontend toggle. The report reads a `status` field first if one is ever added, so it won't need changes.

One behaviour change to be aware of: `POST /tasks` now answers 400 for unknown fields (it used to ignore them). This comes from `taskValidator.js`, which already worked this way, and it matches `PATCH`. The frontend never sends extra fields.

## What I changed

| Finding | Status |
|---|---|
| Bugs 1: lost writes | Fixed: per-file lock, all changes go through `updateJsonArray` |
| Bugs 2: PATCH can change any field | Fixed: controller uses `taskValidator.js` |
| Bugs 3: half-written file | Fixed: write to a temp file, then rename |
| Bugs 4: path depends on cwd | Fixed: `src/config/paths.js` uses `__dirname` |
| Bugs 5: duplicate activity ids | Fixed: `createId()` |
| Bugs 6: different title rules | Fixed: one rule in the validator |
| Performance 1: sync file calls | Fixed: Activity uses async `jsonStore` |
| Performance 2, 3 | Left alone (see above) |
| Security 1: activity accepts anything | Fixed: `activityValidator.js` |
| Security 2: headers / rate limit | Left alone (see above) |
| Security 3: dependency advisories | Fixed with `npm audit fix` (one moderate left, see above) |
| Maintainability 1, 2 | Fixed |
| Code quality 1, 2 | Fixed |

---

# Frontend

All paths below are inside the `frontend` folder.

## Good things I kept

- The Task Dashboard is split well. The data logic lives in one hook (`useTasks`), and the UI is split into small components (StatusFilter, TaskList, TaskItem).
- The types for the API are in one place (`types/api.ts`), and TypeScript strict mode is on.
- The browser never calls the backend directly. It calls the Next.js API routes, and they call the backend. This avoids CORS problems and hides the backend address.
- Some good accessibility work already: `aria-pressed` on the filter buttons and a clear `aria-label` on the toggle button.
- The toggle button is disabled and shows "Saving..." while the request is running, and there is a Retry button when loading fails.

The Activity Feed is the module with most of the problems. The Task Dashboard is mostly fine and only needs smaller fixes.

---

## Bugs

### 1. The Activity page crashes when the backend fails (High)

Where: `app/activity/page.tsx` lines 49-60 and line 120

Now: the page calls `response.json()` without checking `response.ok`, and saves whatever comes back as the list.

Problem: when the backend is down, `/api/activity` returns `{ "error": { "message": "..." } }`, which is an object, not an array (I checked this by stopping the backend). The page saves that object as the list, and then `forcedList.map(...)` on line 120 throws "map is not a function", and the whole page crashes. If the request fails in a different way, the `catch` sets an empty list, so the user sees "Total: 0" and thinks there is no activity, when actually something went wrong.

Fix: check `response.ok`, and keep proper loading and error state like the Tasks hook does (see UX 1).

### 2. One failed toggle hides the whole task list (Medium)

Where: `hooks/useTasks.ts` line 73 and `components/tasks/TaskDashboard.tsx` lines 38-49

Now: loading errors and update errors use the same `error` state. The dashboard only shows the list when there is no error.

Problem: if marking one task as completed fails, the whole list disappears and is replaced by an error box. The user loses sight of all their tasks because of one failed click, and "Retry" reloads everything instead of retrying the click.

Fix: keep two separate errors: one for loading (replace the list) and one for updates (show a small message and keep the list on screen).

### 3. The API routes turn every backend error into 500 (Medium)

Where: `app/api/tasks/[id]/route.ts` lines 23-27, `app/api/tasks/route.ts` lines 8-12, `app/api/activity/route.ts` lines 8-12, and `lib/backendApi.ts` (every function)

Now: `backendApi.ts` throws a plain Error with only the message, so the real status code is lost. The routes then always answer with 500.

Problem: a 404 (task not found) or a 400 (bad input) from the backend reaches the browser as 500. Also, sending broken JSON to `PATCH /api/tasks/:id` gives 500 instead of 400. The frontend can't tell "you did something wrong" from "the server is broken". I tested both: PATCH with an unknown id returns 404 from the backend but 500 from `/api/tasks/:id`.

Fix: make backendApi throw an error that keeps the status code (a small ApiError class), and have the routes pass that status code on. Broken JSON in the request should return 400.

### 4. The user can see technical error messages (Low)

Where: `hooks/useTasks.ts` lines 23-30

Now: if the error response is not JSON (for example an HTML error page), `response.json()` fails, and the catch shows that parse error's message.

Problem: the user sees something like "Unexpected token '<' in JSON" instead of a normal message. The code also throws an error inside its own try and catches it again right away, which is hard to follow.

Fix: read the error body safely, and if it isn't usable, fall back to a simple message like "Request failed (500)".

### 5. Only one task can be "saving" at a time (Low)

Where: `hooks/useTasks.ts` lines 40, 61 and 75

Now: `updatingTaskId` holds one id.

Problem: if the user clicks task A and then task B quickly, B replaces A as the saving one. When A finishes it clears the value, so B's button turns back on while B is still saving, and the user can click it again.

Fix: keep a Set of ids that are saving, instead of a single id.

---

## Performance

### 1. The Activity page re-renders and copies the whole list every 1.4 seconds (High)

Where: `app/activity/page.tsx` lines 63-83

Now: a `setInterval` changes a `tick` value every 1.4 seconds. Each tick runs the filter again and makes a new copy of the list (sometimes copying every item too), even if nothing changed.

Problem: the page keeps doing work forever while it is open, and the whole list re-renders every 1.4 seconds for no reason. With a long activity log this makes typing in the search box feel slow and uses battery. The tick doesn't fetch new data either, so it doesn't even keep the feed up to date.

Fix: remove the interval, `tick` and `forcedList` completely. Only filter again when the list or the search text changes (see React best practices 1). If the feed should update on its own later, poll the API instead.

---

## Security

### 1. Next.js version has known security issues (High)

Where: `package.json` (`"next": "14.2.5"`)

Now: the project is pinned to Next.js 14.2.5. `npm audit` reports it as critical, with a long list of advisories (cache poisoning, denial of service, middleware bypass and others). It also reports `nanoid` as high.

Problem: this is a production app, and these are publicly known issues. Many of them are in features this app doesn't use (image optimization, middleware, server actions), so the real risk is lower than "critical" sounds, but it's still the first thing a security scan will flag.

Fix: update to the latest 14.2.x release. It's a patch update, so no code changes are needed, and it fixes a lot of these. Some advisories are only fixed in newer major versions (15/16), which also need React 19. That is a bigger change with its own testing, so I would plan it separately instead of doing it inside this task.

---

## UX issues

### 1. The Activity page has no loading, error or empty state (Medium)

Where: `app/activity/page.tsx` lines 93-131

Now: while loading, after a failure, and when there is really no activity, the page looks the same: "Total: 0" and an empty box.

Problem: the user can't tell if it's still loading, if something broke, or if there's simply nothing there. There is no way to retry either.

Fix: show "Loading activity...", an error message with a Retry button, and a clear empty message ("No activity yet" or "No results for this search"). The Task Dashboard already does most of this, so the two pages should behave the same.

### 2. Every activity shows its date twice (Low)

Where: `app/activity/page.tsx` lines 124-126

Now: each item prints `formatTimeA(item.when)` and then `formatTimeB(item.when)`, which give exactly the same text.

Fix: show it once. A relative time like "5 minutes ago", with the full date on hover, would also be easier to read.

### 3. The newest activity is at the bottom (Low)

Where: `app/activity/page.tsx` line 120

Now: the list is shown in the order of the file, so the oldest entry is first.

Problem: in a feed, people expect the latest thing at the top.

Fix: sort by `when`, newest first.

### 4. The search box has no label (Low)

Where: `app/activity/page.tsx` lines 104-109

Now: it only has a placeholder.

Problem: screen readers may not announce what the field is for, and the placeholder disappears when you start typing.

Fix: add a label (it can be visually hidden) or an `aria-label`.

### 5. No navigation between pages (Low)

Where: `app/tasks/page.tsx` lines 7-11 and `app/activity/page.tsx` lines 95-99

Now: each page only has a "Back" link to the home page.

Problem: to go from Tasks to Activity you have to go back home first, and there is no way to see which page you are on. This gets worse when we add /reports.

Fix: add one shared navigation bar in `app/layout.tsx` with links to all pages and the current page highlighted.

---

## React best practices

### 1. The Activity page keeps the same data in three states (Medium)

Where: `app/activity/page.tsx` lines 8-12 and 71-83

Now: `allActivity`, `shownActivity` and `forcedList` all hold versions of the same list, and `useEffect`s copy one into the other.

Problem: the filtered list can be calculated from `allActivity` and `query`, so it doesn't need its own state. Copying state with effects causes extra renders (the page renders, the effect runs, it sets state, the page renders again), and it is easy for the copies to get out of sync.

Fix: keep only `allActivity` and `query` in state, and calculate the visible list with `useMemo`. This is how `filteredTasks` already works in `useTasks.ts`.

### 2. Helper functions are created inside the component and missing from effect dependencies (Low)

Where: `app/activity/page.tsx` lines 14-46 and line 75

Now: `formatTimeA/B` and `applyFilterA/B` are defined inside the component, so they are created again on every render. The effect on line 71 uses them but doesn't list them as dependencies (ESLint's `react-hooks/exhaustive-deps` rule would warn about this).

Fix: they don't use any props or state, so move them outside the component (or into a `lib/` file). Then they are created once and the dependency warning goes away.

---

## Maintainability

### 1. The Activity Feed doesn't follow the structure of the Task Dashboard (Medium)

Where: `app/activity/page.tsx` (the whole file)

Now: the fetching, filtering, formatting and all the markup are in one 133-line page component. The Task Dashboard has a hook and small components.

Problem: two different styles in the same small app. It is harder to test or reuse anything from the Activity page.

Fix: move the data logic into a `useActivity` hook (like `useTasks`), and split the UI into small components such as `ActivitySearch` and `ActivityList`.

### 2. Inline styles and hard-coded colors everywhere (Medium)

Where: almost every component, for example `components/tasks/TaskDashboard.tsx` line 39 (`#e3b4c0`, `#fff8fa`) and `app/activity/page.tsx` lines 101-126

Now: most of the styling is written as `style={{ ... }}` in the JSX, with some colors written directly as hex values.

Problem: changing the design means editing every component one by one, the same values are repeated in many places, and the JSX is hard to read. This also makes the UI improvement task much harder.

Fix: move the styles into CSS classes, and keep colors and spacing as CSS variables in `globals.css`, so the whole look can be changed from one place.

---

## Code quality

### 1. Copy-pasted functions, and the search runs twice (Low)

Where: `app/activity/page.tsx` lines 14-20, 22-46 and 72-73

Now: `formatTimeA` and `formatTimeB` are the same. `applyFilterA` and `applyFilterB` do the same thing (one uses `includes`, the other `indexOf`), and the code runs both, one after the other, on every change.

Problem: double the code to maintain, and the list gets filtered twice for the same result.

Fix: keep one format function and one filter function.

---

## Things I left alone on purpose

- Data loading in client hooks. The Task Dashboard loads data in the browser with a hook. Moving it to Server Components would be a big rewrite. The brief says not to rewrite everything, so I kept this approach and made the Activity Feed follow it too.
- The Next.js API routes as a proxy. I kept them, because they avoid CORS and keep the backend address on the server.
- Live updates for the Activity Feed. The old timer did not actually fetch new data, so removing it doesn't lose any feature.
- The Next.js upgrade (Security 1). Updating to the latest 14.2.x is a patch update and the first thing I would do next. I kept it out of this change set so every behaviour change here could be tested on its own.
- The "Total | Visible" line on the Activity page is now shown as the entry count in the page header and "Showing 1–10 of N" under the table. Same information, clearer place.

## What I changed

| Finding | Status |
|---|---|
| Bugs 1: Activity page crash | Fixed: checks `response.ok` and the response shape, shows an error with Retry |
| Bugs 2: failed toggle hides the list | Fixed: separate load and update errors |
| Bugs 3: every error becomes 500 | Fixed: `ApiError` keeps the backend status; invalid JSON returns 400 |
| Bugs 4: technical error messages | Fixed: safe error parsing with a simple fallback |
| Bugs 5: one saving task at a time | Fixed: a Set of saving ids |
| Performance 1: 1.4 s timer | Fixed: timer and copied state removed |
| Security 1: Next.js version | Left alone (see above) |
| UX 1–4 | Fixed: loading / error / empty states, one relative date, newest first, labelled search |
| UX 5: no navigation | Fixed: shared layout with sidebar, header and footer |
| React best practices 1, 2 | Fixed: no derived state; helpers moved to `lib/` |
| Maintainability 1 | Fixed: `useActivity` hook + small components, same structure as Tasks |
| Maintainability 2 | Fixed: CSS Modules and CSS variables, no inline styles (except the computed bar width) |
| Code quality 1 | Fixed |

Beyond the review I also added: the `/reports` page, a light/dark theme, and sortable, searchable, paginated tables (TanStack Table) for Tasks and Activity.
