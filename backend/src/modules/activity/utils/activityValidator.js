const HttpError = require('../../../utils/httpError');

const TEXT_FIELDS = ['action', 'info'];
const MAX_TEXT_LENGTH = 500;

// action and info stay optional, as they were before, so existing clients keep
// working. When they are sent they must be strings of a reasonable length.
function validateCreateActivity(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Body must be a JSON object.');
  }

  const normalized = {};

  for (const field of TEXT_FIELDS) {
    if (payload[field] === undefined) {
      continue;
    }

    if (typeof payload[field] !== 'string') {
      throw new HttpError(400, `"${field}" must be a string.`);
    }

    const value = payload[field].trim();
    if (value.length > MAX_TEXT_LENGTH) {
      throw new HttpError(400, `"${field}" must be at most ${MAX_TEXT_LENGTH} characters.`);
    }

    normalized[field] = value;
  }

  return normalized;
}

module.exports = {
  validateCreateActivity,
};
