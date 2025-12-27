/**
 * Tests for Auth Middleware
 */

const jwt = require('jsonwebtoken');
const authMiddleware = require('../authMiddleware');

// JWT configuration (should match authMiddleware.js)
const JWT_SECRET = process.env.JWT_SECRET || 'mock-secret-key-for-development-only';
const JWT_ISSUER = 'pantrybot.app';
const JWT_AUDIENCE = 'pantrybot.app';

describe('authMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  /**
   * Helper to create valid JWT token
   */
  function createToken(payload = {}, options = {}) {
    const defaultPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      type: 'access',
      ...payload,
    };
    return jwt.sign(defaultPayload, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: '15m',
      ...options,
    });
  }

  describe('successful authentication', () => {
    it('should call next() for valid token', () => {
      const token = createToken();
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should attach user info to request', () => {
      const token = createToken({
        sub: 'user-456',
        email: 'user@test.com',
      });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-456');
      expect(req.user.email).toBe('user@test.com');
    });
  });

  describe('missing authorization', () => {
    it('should return 401 when no authorization header', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No authorization token provided',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('invalid authorization header format', () => {
    it('should return 401 for non-Bearer token', () => {
      req.headers.authorization = 'Basic sometoken';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed header', () => {
      req.headers.authorization = 'Bearer';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      });
    });

    it('should return 401 for header with extra parts', () => {
      req.headers.authorization = 'Bearer token extra';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('invalid token', () => {
    it('should return 401 for invalid token signature', () => {
      const token = jwt.sign(
        { sub: 'user-123', type: 'access' },
        'wrong-secret',
        { issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });

    it('should return 401 for malformed token', () => {
      req.headers.authorization = 'Bearer not.a.valid.jwt';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });
  });

  describe('expired token', () => {
    it('should return 401 for expired token', () => {
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', type: 'access' },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
          expiresIn: '-1s', // Already expired
        }
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token has expired',
      });
    });
  });

  describe('wrong token type', () => {
    it('should return 401 for refresh token', () => {
      const token = createToken({ type: 'refresh' });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
    });

    it('should return 401 for missing token type', () => {
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com' },
        JWT_SECRET,
        { issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
    });
  });

  describe('wrong issuer or audience', () => {
    it('should return 401 for wrong issuer', () => {
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', type: 'access' },
        JWT_SECRET,
        {
          issuer: 'wrong-issuer',
          audience: JWT_AUDIENCE,
        }
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });

    it('should return 401 for wrong audience', () => {
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', type: 'access' },
        JWT_SECRET,
        {
          issuer: JWT_ISSUER,
          audience: 'wrong-audience',
        }
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });
  });
});
