const fs = require('node:fs/promises');

// The last pending operation for each file. New operations are chained after
// it, so work on the same file runs one at a time.
const fileQueues = new Map();

function withFileLock(filePath, task) {
  const previous = fileQueues.get(filePath) || Promise.resolve();
  const result = previous.then(() => task());

  // The next operation waits for this one, but must not fail because of it.
  fileQueues.set(filePath, result.catch(() => {}));

  return result;
}

async function readJsonArray(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]\n', 'utf-8');
      return [];
    }

    throw error;
  }
}

// Write to a temp file, then rename it over the real one. A rename happens
// fully or not at all, so a crash can't leave a half-written file behind.
async function writeFileAtomic(filePath, data) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  await fs.rename(tempPath, filePath);
}

// Read, change and save a file as one locked step, so two requests can't
// overwrite each other's changes. updateFn changes the array in place and
// returns whatever the caller needs back. If it throws, nothing is saved.
function updateJsonArray(filePath, updateFn) {
  return withFileLock(filePath, async () => {
    const items = await readJsonArray(filePath);
    const result = await updateFn(items);
    await writeFileAtomic(filePath, items);
    return result;
  });
}

module.exports = {
  readJsonArray,
  updateJsonArray,
};
