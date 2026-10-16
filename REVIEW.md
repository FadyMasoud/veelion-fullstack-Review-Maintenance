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

Where: `src/modules/tasks/services/tasks.service.js` lines 49-53, 67-82, 88-96 and `src/modules/activity/services/activity.service.js` lines 38-47

Now: every change reads the whole file, changes the array in memory, then writes the whole file back. Nothing stops two requests from doing this at the same time.

Problem: if two users add a task at the same moment, both read the same old list, and the second write replaces the first one. Both users get 201 Created but one task is gone and there is no error anywhere. I tested it by sending 20 POST /tasks at the same time and only 19 were saved.

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

---

# Frontend

To be completed after reviewing the Task Dashboard and Activity Feed.
