/**
 * Global Error Handler Middleware
 *
 * Features:
 * - Structured error logging
 * - Error categorization by type
 * - Stack trace logging (non-production)
 * - Correlation ID attachment
 * - Consistent error response format
 */

const { logger } = require('../lib/logger');

/**
 * Error types for categorization
 */
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
};

/**
 * Map status codes to error types
 */
function getErrorType(statusCode, error) {
  // Check for specific error names/types
  if (error.name === 'ValidationError' || error.type === 'validation') {
    return ErrorTypes.VALIDATION;
  }
  if (error.name === 'UnauthorizedError' || error.code === 'UNAUTHORIZED') {
    return ErrorTypes.AUTHENTICATION;
  }
  if (error.name === 'ForbiddenError' || error.code === 'FORBIDDEN') {
    return ErrorTypes.AUTHORIZATION;
  }
  if (error.name === 'PrismaClientKnownRequestError') {
    return ErrorTypes.DATABASE;
  }

  // Map by status code
  switch (statusCode) {
    case 400:
      return ErrorTypes.VALIDATION;
    case 401:
      return ErrorTypes.AUTHENTICATION;
    case 403:
      return ErrorTypes.AUTHORIZATION;
    case 404:
      return ErrorTypes.NOT_FOUND;
    case 409:
      return ErrorTypes.CONFLICT;
    case 429:
      return ErrorTypes.RATE_LIMIT;
    default:
      return statusCode >= 500 ? ErrorTypes.INTERNAL : ErrorTypes.VALIDATION;
  }
}

/**
 * Determine if error details should be exposed to client
 */
function shouldExposeError(error, statusCode) {
  // Always hide internal server error details in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    return false;
  }
  return true;
}

/**
 * Format error response for client
 */
function formatErrorResponse(error, statusCode, correlationId) {
  const response = {
    error: {
      message: shouldExposeError(error, statusCode)
        ? error.message
        : 'An internal server error occurred',
      code: error.code || getErrorType(statusCode, error),
      correlationId,
    },
  };

  // Add validation errors if present
  if (error.errors && Array.isArray(error.errors)) {
    response.error.details = error.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.error.stack = error.stack.split('\n');
  }

  return response;
}

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
function errorHandler(err, req, res, next) {
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Get correlation ID
  const correlationId = req.correlationId || req.id || 'unknown';

  // Categorize error
  const errorType = getErrorType(statusCode, err);

  // Create error log context
  const errorContext = {
    correlationId,
    errorType,
    statusCode,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    householdId: req.params?.householdId || req.headers['x-household-id'],
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.socket?.remoteAddress,
  };

  // Add request body for debugging (redacted sensitive fields)
  if (req.body && Object.keys(req.body).length > 0) {
    errorContext.requestBody = {
      ...req.body,
      password: req.body.password ? '[REDACTED]' : undefined,
      currentPassword: req.body.currentPassword ? '[REDACTED]' : undefined,
      newPassword: req.body.newPassword ? '[REDACTED]' : undefined,
    };
  }

  // Log the error
  const logMethod = statusCode >= 500 ? 'error' : 'warn';
  const log = req.log || logger;

  log[logMethod](
    {
      err: {
        message: err.message,
        name: err.name,
        code: err.code,
        stack: err.stack,
      },
      ...errorContext,
    },
    `${req.method} ${req.path} failed with ${statusCode}: ${err.message}`
  );

  // Send error response
  const response = formatErrorResponse(err, statusCode, correlationId);
  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 * Register before error handler for unmatched routes
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  error.statusCode = 404;
  error.code = ErrorTypes.NOT_FOUND;
  next(error);
}

/**
 * Create an HTTP error with status code
 */
function createHttpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

module.exports = {
  errorHandler,
  notFoundHandler,
  createHttpError,
  ErrorTypes,
};
