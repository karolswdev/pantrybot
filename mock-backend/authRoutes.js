const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { users, households, household_members, validRefreshTokens } = require('./db');

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

function generateRefreshToken(userId) {
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
  // Store the token in valid tokens set for validation
  validRefreshTokens.add(token);
  return token;
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
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

    // Password strength check (simplified for mock)
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      displayName,
      timezone: timezone || 'UTC',
      createdAt: new Date()
    };
    users.push(newUser);

    // Create default household for the user
    const householdId = uuidv4();
    const newHousehold = {
      id: householdId,
      name: `${displayName}'s Home`,
      description: 'Default household',
      createdBy: userId,
      createdAt: new Date()
    };
    households.push(newHousehold);

    // Add user as admin of the household
    household_members.push({
      householdId,
      userId,
      role: 'admin',
      joinedAt: new Date()
    });

    // Generate tokens
    const accessToken = generateAccessToken(userId, newUser.email);
    const refreshToken = generateRefreshToken(userId);

    // Return response
    res.status(201).json({
      userId,
      email: newUser.email,
      displayName: newUser.displayName,
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      defaultHouseholdId: householdId
    });
  } catch (error) {
    console.error('Registration error:', error);
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
    const user = users.find(u => u.email === email.toLowerCase());
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
    const userHouseholds = household_members
      .filter(hm => hm.userId === user.id)
      .map(hm => {
        const household = households.find(h => h.id === hm.householdId);
        return {
          id: hm.householdId,
          name: household ? household.name : 'Unknown',
          role: hm.role
        };
      });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Return response
    res.status(200).json({
      userId: user.id,
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      households: userHouseholds
    });
  } catch (error) {
    console.error('Login error:', error);
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

    // Check if token is in valid tokens set
    if (!validRefreshTokens.has(refreshToken)) {
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
      // Remove invalid token from set
      validRefreshTokens.delete(refreshToken);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    // Check token type
    if (decoded.type !== 'refresh') {
      validRefreshTokens.delete(refreshToken);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    // Find user
    const user = users.find(u => u.id === decoded.sub);
    if (!user) {
      validRefreshTokens.delete(refreshToken);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    // Rotate refresh token (invalidate old, generate new)
    validRefreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id);

    // Return response
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during token refresh'
    });
  }
});

module.exports = router;