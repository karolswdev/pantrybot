const express = require('express');
const cors = require('cors');
const http = require('http');

// Import logger and middleware
const { logger } = require('./lib/logger');
const { register } = require('./lib/metrics');
const {
  requestLogger,
  correlationIdMiddleware,
  attachLoggerMiddleware,
} = require('./middleware/requestLogger');
const {
  errorHandler,
  notFoundHandler,
} = require('./middleware/errorHandler');
const metricsMiddleware = require('./middleware/metricsMiddleware');

// Import routes
const authRoutes = require('./authRoutes');
const householdRoutes = require('./householdRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const notificationRoutes = require('./notificationRoutes');
const shoppingListRoutes = require('./shoppingListRoutes');
const llmRoutes = require('./llmRoutes');
const telegramRoutes = require('./telegramRoutes');
const { initializeSocket } = require('./socket');
const { prisma } = require('./repositories');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Core middleware
app.use(cors());
app.use(express.json());

// Observability middleware (order matters!)
app.use(correlationIdMiddleware); // Generate/extract correlation ID first
app.use(metricsMiddleware); // Collect HTTP metrics (before logging for accurate timing)
app.use(requestLogger); // Log all requests with correlation ID
app.use(attachLoggerMiddleware); // Attach logger to request for use in handlers

// Metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate metrics');
    res.status(500).end();
  }
});

// Health endpoint (before auth, no logging needed)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Ready endpoint for Kubernetes probes
app.get('/ready', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready', database: 'connected' });
  } catch (error) {
    logger.error({ err: error }, 'Readiness check failed');
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// Authentication routes
app.use('/api/v1/auth', authRoutes);

// Household routes (protected by auth middleware)
app.use('/api/v1/households', householdRoutes);

// Inventory routes (protected by auth middleware)
// Pass io instance to inventory routes for broadcasting
app.use('/api/v1', (req, res, next) => {
  req.io = io;
  next();
}, inventoryRoutes);

// Dashboard routes (protected by auth middleware)
app.use('/api/v1/dashboard', dashboardRoutes);

// Activity feed and reports routes (from dashboardRoutes, household-specific)
app.use('/api/v1', dashboardRoutes);

// Notification routes (protected by auth middleware)
app.use('/api/v1/notifications', notificationRoutes);

// Shopping list routes (protected by auth middleware)
// Pass io instance to shopping list routes for broadcasting
app.use('/api/v1/households', (req, res, next) => {
  req.io = io;
  next();
}, shoppingListRoutes);

// LLM routes for conversational inventory management
app.use('/api/v1/llm', llmRoutes);

// Telegram bot routes
app.use('/api/v1/telegram', telegramRoutes);

// Test utilities (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  const testRoutes = require('./testRoutes');
  app.use('/api/v1/test', testRoutes);
}

// Debug routes (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  const debugRoutes = require('./debugRoutes');
  app.use('/debug', debugRoutes);
}

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || 'development',
      database: process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory',
    },
    `Pantrybot backend started on port ${PORT}`
  );
});

// Graceful shutdown
async function shutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal, closing connections...');

  try {
    // Close Socket.IO connections
    io.close(() => {
      logger.info('Socket.IO connections closed');
    });

    // Disconnect from database
    await prisma.$disconnect();
    logger.info('Database connection closed');

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception - shutting down');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
});
