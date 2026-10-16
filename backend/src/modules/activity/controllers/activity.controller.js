const activityService = require('../services/activity.service');
const { validateCreateActivity } = require('../utils/activityValidator');

// Activity responses are plain objects and arrays (not wrapped in { data }).
// The frontend and docs depend on this shape, so it is kept as it was.
async function listActivity(req, res) {
  const activities = await activityService.getAllActivity();
  res.status(200).json(activities);
}

async function createActivity(req, res) {
  const payload = validateCreateActivity(req.body);
  const newActivity = await activityService.createActivity(payload);
  res.status(201).json(newActivity);
}

module.exports = {
  listActivity,
  createActivity,
};
