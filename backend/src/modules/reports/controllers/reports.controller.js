const reportsService = require('../services/reports.service');
const { parseRecentDays } = require('../utils/reportsValidator');

// Returns a plain object (not wrapped in { data }), matching the documented shape.
async function getTasksSummary(req, res) {
  const recentDays = parseRecentDays(req.query.days);
  const summary = await reportsService.getTasksSummary({ recentDays });
  res.status(200).json(summary);
}

module.exports = {
  getTasksSummary,
};
