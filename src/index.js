require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./utils/logger');
const { authMiddleware } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');
const postsRouter = require('./routes/posts');
const analyticsRouter = require('./routes/analytics');
const queueRouter = require('./routes/queue');
const scheduler = require('./jobs/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Middleware ---------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// --------------- Health check (no auth) ---------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'postflow-ai',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// --------------- API routes (auth required) ---------------
app.use('/api/posts', authMiddleware, postsRouter);
app.use('/api/analytics', authMiddleware, analyticsRouter);
app.use('/api/queue', authMiddleware, queueRouter);

// --------------- Serve React dashboard ---------------
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// --------------- Error handler ---------------
app.use((err, _req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// --------------- Start ---------------
app.listen(PORT, () => {
  logger.info(`PostFlow AI running on port ${PORT}`);
  scheduler.start();
  logger.info('Scheduler started — checking every 5 minutes');
});
