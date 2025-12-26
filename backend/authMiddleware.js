const jwt = require('jsonwebtoken');

// JWT configuration (should match authRoutes.js)
const JWT_SECRET = process.env.JWT_SECRET || 'mock-secret-key-for-development-only';
const JWT_ISSUER = 'pantrybot.app';
const JWT_AUDIENCE = 'pantrybot.app';

/**
 * Authentication middleware to verify JWT tokens
 * Extracts JWT from 'Authorization: Bearer <token>' header
 * Verifies the token and attaches decoded user payload to req.user
 * Returns 401 Unauthorized if token is missing or invalid
 */
function authMiddleware(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided'
      });
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format'
      });
    }

    const token = parts[1];

    // Verify and decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      } else {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token verification failed'
        });
      }
    }

    // Check token type (should be access token)
    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type'
      });
    }

    // Attach user information to request object
    req.user = {
      id: decoded.sub,
      email: decoded.email
    };

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication'
    });
  }
}

module.exports = authMiddleware;