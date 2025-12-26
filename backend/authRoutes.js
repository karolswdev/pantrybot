const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { userRepository, householdRepository, refreshTokenRepository } = require('./repositories');
const { logger, maskEmail } = require('./lib/logger');

const router = express.Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'mock-secret-key-for-development-only';
const JWT_ISSUER = 'fridgr.app';
const JWT_AUDIENCE = 'fridgr.app';
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// Helper function to generate JWT tokens
function generateAccessToken(userId, email) {
  return jwt.sign(
    {
      sub: userId,
      email: email,
      type: 'access'
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  );
}

async function generateRefreshToken(userId) {
  const tokenId = uuidv4();
  const token = jwt.sign(
    {
      sub: userId,
      jti: tokenId,
      type: 'refresh'
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }
  );

  // Store the token in database
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
  await refreshTokenRepository.createToken(userId, token, expiresAt);

  return token;
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    // Check if body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request body is required'
      });
    }

    const { email, password, displayName, timezone } = req.body;

    // Basic validation
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email, password, and displayName are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    // Password strength check
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with default household
    const { user, household } = await userRepository.createWithDefaultHousehold({
      email: email.toLowerCase(),
      passwordHash,
      displayName,
      timezone: timezone || 'UTC'
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id);

    // Return response
    res.status(201).json({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      defaultHouseholdId: household.id
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, email: maskEmail(req.body?.email) }, 'Registration failed');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during registration'
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Get user's households
    const userHouseholds = await householdRepository.findUserHouseholds(user.id);
    const householdsResponse = userHouseholds.map(h => ({
      id: h.id,
      name: h.name,
      role: h.role
    }));

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id);

    // Return response
    res.status(200).json({
      userId: user.id,
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      households: householdsResponse
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, email: maskEmail(req.body?.email) }, 'Login failed');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during login'
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Basic validation
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });
    } catch (err) {
      await refreshTokenRepository.revokeToken(refreshToken);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    // Check token type
    if (decoded.type !== 'refresh') {
      await refreshTokenRepository.revokeToken(refreshToken);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new tokens and rotate
    const newTokenValue = jwt.sign(
      {
        sub: decoded.sub,
        jti: uuidv4(),
        type: 'refresh'
      },
      JWT_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      }
    );

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
    const result = await refreshTokenRepository.rotateToken(refreshToken, newTokenValue, expiresAt);

    if (!result) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    const { user } = result;
    const newAccessToken = generateAccessToken(user.id, user.email);

    // Return response
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newTokenValue,
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error }, 'Token refresh failed');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during token refresh'
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await refreshTokenRepository.revokeToken(refreshToken);
    }

    res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error }, 'Logout failed');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during logout'
    });
  }
});

module.exports = router;
