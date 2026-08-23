/**
 * VERCEL SERVERLESS FUNCTION ENTRYPOINT
 * Exports Express app to handle Vercel Serverless Function requests (/api/* and /health)
 */
const app = require('../server.cjs');

module.exports = (req, res) => {
  return app(req, res);
};
