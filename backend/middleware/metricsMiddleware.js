/**
 * Metrics Middleware
 *
 * Automatically tracks HTTP request metrics:
 * - Request duration (histogram)
 * - Request count (counter)
 * - Error count (counter)
 * - Active connections (gauge)
 */

const {
  httpRequestDuration,
  httpRequestTotal,
  httpErrorsTotal,
  httpActiveConnections,
  normalizeRoute,
  getErrorType
} = require('../lib/metrics');

/**
 * Express middleware to collect HTTP metrics
 */
function metricsMiddleware(req, res, next) {
  // Skip metrics endpoint to avoid recursion
  if (req.path === '/metrics') {
    return next();
  }

  // Track active connections
  httpActiveConnections.inc();

  // Start timer
  const startTime = process.hrtime.bigint();

  // Store original end function
  const originalEnd = res.end;

  // Override end to capture metrics
  res.end = function (...args) {
    // Calculate duration in seconds
    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationSeconds = durationNs / 1e9;

    // Get normalized route for metrics labels
    // Use route pattern if available (e.g., /api/v1/households/:id)
    // Otherwise normalize the actual path
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : normalizeRoute(req.path);

    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record request duration
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(durationSeconds);

    // Increment request counter
    httpRequestTotal
      .labels(method, route, statusCode)
      .inc();

    // Track errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      httpErrorsTotal
        .labels(method, route, statusCode, getErrorType(res.statusCode))
        .inc();
    }

    // Decrement active connections
    httpActiveConnections.dec();

    // Call original end
    return originalEnd.apply(this, args);
  };

  next();
}

module.exports = metricsMiddleware;
