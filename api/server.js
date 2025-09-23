// api/server.js
const serverless = require('serverless-http');
const app = require('../server/app');

// Export Vercel serverless handler
module.exports = (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};
