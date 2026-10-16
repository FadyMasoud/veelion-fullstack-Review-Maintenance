const { createId } = require('../../../utils/id');
const { readJsonArray, updateJsonArray } = require('../../../utils/jsonStore');
const { ACTIVITY_FILE_PATH } = require('../../../config/paths');

async function getAllActivity() {
  return readJsonArray(ACTIVITY_FILE_PATH);
}

async function createActivity(payload) {
  return updateJsonArray(ACTIVITY_FILE_PATH, (activities) => {
    const newActivity = {
      id: createId(),
      action: payload.action,
      info: payload.info,
      when: new Date().toISOString(),
    };

    activities.push(newActivity);
    return newActivity;
  });
}

module.exports = {
  getAllActivity,
  createActivity,
};
