/**
 * Tests for Error Handler Middleware
 */

const {
  errorHandler,
  notFoundHandler,
  createHttpError,
  ErrorTypes,
} = require('../../middleware/errorHandler');

// Mock logger
jest.mock('../../lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      method: 'GET',
      path: '/api/v1/test',
      correlationId: 'test-correlation-id',
      headers: {
        'user-agent': 'test-agent',
      },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      body: {},
      params: {},
      log: {
        error: jest.fn(),
        warn: jest.fn(),
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset NODE_ENV for each test
    process.env.NODE_ENV = 'test';
  });

  describe('errorHandler', () => {
    it('should handle 500 errors', () => {
      const error = new Error('Internal server error');
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Internal server error',
            correlationId: 'test-correlation-id',
          }),
        })
      );
      expect(req.log.error).toHaveBeenCalled();
    });

    it('should handle 400 errors', () => {
      const error = new Error('Bad request');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(req.log.warn).toHaveBeenCalled();
    });

    it('should handle 401 errors', () => {
      const error = new Error('Unauthorized');
      error.statusCode = 401;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.AUTHENTICATION,
          }),
        })
      );
    });

    it('should handle 403 errors', () => {
      const error = new Error('Forbidden');
      error.statusCode = 403;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.AUTHORIZATION,
          }),
        })
      );
    });

    it('should handle 404 errors', () => {
      const error = new Error('Not found');
      error.statusCode = 404;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.NOT_FOUND,
          }),
        })
      );
    });

    it('should handle 409 conflict errors', () => {
      const error = new Error('Resource conflict');
      error.statusCode = 409;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.CONFLICT,
          }),
        })
      );
    });

    it('should handle 429 rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      error.statusCode = 429;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.RATE_LIMIT,
          }),
        })
      );
    });

    it('should default to 500 when no status code', () => {
      const error = new Error('Unknown error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should use error.status if statusCode not present', () => {
      const error = new Error('Bad request');
      error.status = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should include validation errors when present', () => {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: error.errors,
          }),
        })
      );
    });

    it('should handle ValidationError type', () => {
      const error = new Error('Invalid input');
      error.name = 'ValidationError';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.VALIDATION,
          }),
        })
      );
    });

    it('should handle UnauthorizedError type', () => {
      const error = new Error('Invalid token');
      error.name = 'UnauthorizedError';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.AUTHENTICATION,
          }),
        })
      );
    });

    it('should handle ForbiddenError type', () => {
      const error = new Error('Access denied');
      error.name = 'ForbiddenError';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.AUTHORIZATION,
          }),
        })
      );
    });

    it('should handle PrismaClientKnownRequestError', () => {
      const error = new Error('Database error');
      error.name = 'PrismaClientKnownRequestError';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorTypes.DATABASE,
          }),
        })
      );
    });

    it('should use custom error code when provided', () => {
      const error = new Error('Custom error');
      error.statusCode = 400;
      error.code = 'CUSTOM_ERROR_CODE';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'CUSTOM_ERROR_CODE',
          }),
        })
      );
    });

    it('should redact passwords in request body', () => {
      req.body = {
        email: 'test@example.com',
        password: 'secret123',
        newPassword: 'newSecret456',
      };
      const error = new Error('Test error');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      const logCall = req.log.warn.mock.calls[0][0];
      expect(logCall.requestBody.password).toBe('[REDACTED]');
      expect(logCall.requestBody.newPassword).toBe('[REDACTED]');
      expect(logCall.requestBody.email).toBe('test@example.com');
    });

    it('should include stack trace in non-production', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      error.statusCode = 400;
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(Array),
          }),
        })
      );
    });

    it('should hide error details for 500 in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive database details');
      error.statusCode = 500;

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'An internal server error occurred',
          }),
        })
      );
    });

    it('should include user context in log', () => {
      req.user = { id: 'user-123' };
      req.params = { householdId: 'household-456' };
      const error = new Error('Test error');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      const logCall = req.log.warn.mock.calls[0][0];
      expect(logCall.userId).toBe('user-123');
      expect(logCall.householdId).toBe('household-456');
    });

    it('should fallback to default correlation ID', () => {
      delete req.correlationId;
      delete req.id;
      const error = new Error('Test error');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            correlationId: 'unknown',
          }),
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error and call next', () => {
      req.method = 'GET';
      req.path = '/api/v1/nonexistent';

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ErrorTypes.NOT_FOUND);
      expect(error.message).toContain('GET /api/v1/nonexistent');
    });

    it('should include HTTP method in error message', () => {
      req.method = 'POST';
      req.path = '/api/v1/test';

      notFoundHandler(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toContain('POST /api/v1/test');
    });
  });

  describe('createHttpError', () => {
    it('should create error with status code', () => {
      const error = createHttpError(400, 'Bad request');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
    });

    it('should create error with custom code', () => {
      const error = createHttpError(403, 'Access denied', 'INSUFFICIENT_PERMISSIONS');

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should work with various status codes', () => {
      const error404 = createHttpError(404, 'Not found');
      const error500 = createHttpError(500, 'Server error');

      expect(error404.statusCode).toBe(404);
      expect(error500.statusCode).toBe(500);
    });
  });

  describe('ErrorTypes', () => {
    it('should have all expected error types', () => {
      expect(ErrorTypes.VALIDATION).toBe('VALIDATION_ERROR');
      expect(ErrorTypes.AUTHENTICATION).toBe('AUTHENTICATION_ERROR');
      expect(ErrorTypes.AUTHORIZATION).toBe('AUTHORIZATION_ERROR');
      expect(ErrorTypes.NOT_FOUND).toBe('NOT_FOUND_ERROR');
      expect(ErrorTypes.CONFLICT).toBe('CONFLICT_ERROR');
      expect(ErrorTypes.RATE_LIMIT).toBe('RATE_LIMIT_ERROR');
      expect(ErrorTypes.DATABASE).toBe('DATABASE_ERROR');
      expect(ErrorTypes.EXTERNAL_SERVICE).toBe('EXTERNAL_SERVICE_ERROR');
      expect(ErrorTypes.INTERNAL).toBe('INTERNAL_ERROR');
    });
  });
});
