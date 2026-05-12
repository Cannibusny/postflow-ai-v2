const logger = require('../utils/logger');

function authMiddleware(req, res, next) {
  const token = process.env.API_BEARER_TOKEN;

  // If no token configured, allow all (dev mode)
  if (!token) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    logger.warn('Unauthorized request — missing Bearer token');
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const provided = header.slice(7);
  if (provided !== token) {
    logger.warn('Unauthorized request — invalid Bearer token');
    return res.status(403).json({ error: 'Invalid token' });
  }

  next();
}

module.exports = { authMiddleware };
