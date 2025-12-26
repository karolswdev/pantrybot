/**
 * HTTP Request Logger Middleware using pino-http
 *
 * Features:
 * - Automatic request/response logging
 * - Correlation ID generation and propagation
 * - User and household context attachment
 * - Custom log levels based on status codes
 * - Sensitive header redaction
 */

const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../lib/logger');

/**
 * Generate or extract correlation ID from request
 * Checks X-Correlation-ID, X-Request-ID headers, or generates new UUID
 */
function generateRequestId(req) {
  return (
    req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    uuidv4()
  );
}

/**
 * Determine log level based on response status code
 */
function customLogLevel(req, res, err) {
  if (err || res.statusCode >= 500) {
    return 'error';
  }
  if (res.statusCode >= 400) {
    return 'warn';
  }
  if (res.statusCode >= 300) {
    return 'info';
  }
  return 'info';
}

/**
 * Create custom success message
 */
function customSuccessMessage(req, res) {
  return `${req.method} ${req.url} completed`;
}

/**
 * Create custom error message
 */
function customErrorMessage(req, res, err) {
  return `${req.method} ${req.url} failed: ${err?.message || 'Unknown error'}`;
}

/**
 * Extract custom properties to include in each log
 */
function customProps(req, res) {
  const props = {
    correlationId: req.id,
  };

  // Add user context if authenticated
  if (req.user) {
    props.userId = req.user.id;
  }

  // Add household context if present
  const householdId =
    req.params?.householdId || req.headers['x-household-id'];
  if (householdId) {
    props.householdId = householdId;
  }

  return props;
}

/**
 * Request serializer - extract relevant request info
 */
function reqSerializer(req) {
  return {
    method: req.method,
    url: req.url,
    path: req.url?.split('?')[0],
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
    },
    remoteAddress: req.socket?.remoteAddress,
  };
}

/**
 * Response serializer - extract relevant response info
 */
function resSerializer(res) {
  return {
    statusCode: res.statusCode,
    headers: {
      'content-type': res.getHeader?.('content-type'),
      'content-length': res.getHeader?.('content-length'),
    },
  };
}

/**
 * Create the pino-http middleware
 */
const requestLogger = pinoHttp({
  logger,
  genReqId: generateRequestId,
  customLogLevel,
  customSuccessMessage,
  customErrorMessage,
  customProps,
  serializers: {
    req: reqSerializer,
    res: resSerializer,
    err: pino.stdSerializers.err,
  },

  // Don't log health check endpoints
  autoLogging: {
    ignore: (req) => {
      const ignorePaths = ['/health', '/ready', '/metrics'];
      return ignorePaths.some((path) => req.url?.startsWith(path));
    },
  },
});

// Import pino for serializers reference
const pino = require('pino');

/**
 * Correlation ID middleware
 * Adds correlation ID to request and response headers
 */
function correlationIdMiddleware(req, res, next) {
  // Generate or use existing correlation ID
  const correlationId = generateRequestId(req);

  // Attach to request for use in handlers
  req.correlationId = correlationId;
  req.id = correlationId;

  // Add to response headers for client tracing
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);

  next();
}

/**
 * Attach logger to request for use in route handlers
 */
function attachLoggerMiddleware(req, res, next) {
  // Create child logger with request context
  req.log = logger.child({
    correlationId: req.correlationId,
    userId: req.user?.id,
    householdId: req.params?.householdId || req.headers['x-household-id'],
  });

  next();
}

module.exports = {
  requestLogger,
  correlationIdMiddleware,
  attachLoggerMiddleware,
};
