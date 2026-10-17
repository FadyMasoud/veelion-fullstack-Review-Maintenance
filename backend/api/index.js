// Entry point for Vercel. Vercel runs files in /api as serverless functions,
// and an Express app is a valid request handler, so we export it directly.
// Locally, `npm start` still runs src/server.js with app.listen().
module.exports = require('../src/app');
