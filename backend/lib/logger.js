/**
 * Centralized Pino logger configuration for Fridgr backend
 *
 * Features:
 * - JSON structured logging
 * - Sensitive data redaction
 * - Pretty printing in development
 * - Correlation ID support
 * - Child logger creation for request context
 */

const pino = require('pino');

// Determine if we should use pretty printing (development only)
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure transport for pretty printing in development
const transport = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

// Create the base logger
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Add base context to all logs
  base: {
    service: 'fridgr-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
  },

  // Custom timestamp format (ISO 8601)
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'passwordHash',
      'accessToken',
      'refreshToken',
      'token',
      'authorization',
      'req.headers.authorization',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      '*.password',
      '*.passwordHash',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },

  // Format level as string instead of number
  formatters: {
    level: (label) => ({ level: label }),
  },

  // Use pretty printing in development
  transport,
});

/**
 * Create a child logger with additional context
 * Useful for adding request-specific context
 *
 * @param {Object} context - Additional context to include in logs
 * @returns {pino.Logger} Child logger instance
 */
function createChildLogger(context) {
  return logger.child(context);
}

/**
 * Create a request-scoped logger
 * Includes correlation ID, user ID, and household ID
 *
 * @param {Object} req - Express request object
 * @returns {pino.Logger} Request-scoped child logger
 */
function createRequestLogger(req) {
  return logger.child({
    correlationId: req.correlationId || req.id,
    userId: req.user?.id,
    householdId: req.params?.householdId || req.headers['x-household-id'],
    method: req.method,
    path: req.path,
  });
}

/**
 * Mask email addresses for privacy in logs
 *
 * @param {string} email - Email address to mask
 * @returns {string} Masked email (e.g., "j***@example.com")
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length > 2
    ? `${local[0]}***${local[local.length - 1]}`
    : `${local[0]}***`;
  return `${masked}@${domain}`;
}

module.exports = {
  logger,
  createChildLogger,
  createRequestLogger,
  maskEmail,
};
