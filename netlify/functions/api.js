// Wraps the Express app as a Netlify Function. Routing to this function is
// defined by the redirects in netlify.toml; static assets in public/ are
// served directly from the CDN. Plain CommonJS, matching the rest of the repo.
const serverless = require('serverless-http');
const app = require('../../src/app');

exports.handler = serverless(app);
