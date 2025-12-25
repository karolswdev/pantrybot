const express = require('express');
const router = express.Router();
const { notification_preferences, users } = require('./db');
const authMiddleware = require('./authMiddleware');

// GET /api/v1/notifications/settings
// Returns the notification settings for the authenticated user
router.get('/settings', authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  // Find existing preferences for the user
  let preferences = notification_preferences.find(p => p.userId === userId);
  
  // Get user email from users table
  const user = users.find(u => u.id === userId);
  const userEmail = user ? user.email : 'user@example.com';
  
  // If no preferences exist, return default settings
  if (!preferences) {
    preferences = {
      email: {
        enabled: true,
        address: userEmail
      },
      inApp: {
        enabled: true
      },
      telegram: {
        enabled: false,
        linked: false,
        username: null
      },
      preferences: {
        expirationWarningDays: 3,
        notificationTypes: ['expiration', 'lowStock', 'shoppingReminder'],
        preferredTime: '09:00',
        timezone: user?.timezone || 'America/New_York'
      }
    };
  }
  
  // Return the preferences in a flat structure for compatibility
  const response = {
    emailEnabled: preferences.email?.enabled || true,
    emailAddress: preferences.email?.address || userEmail,
    pushEnabled: preferences.inApp?.enabled || true,
    telegramEnabled: preferences.telegram?.enabled || false,
    telegramLinked: preferences.telegram?.linked || false,
    telegramUsername: preferences.telegram?.username || null,
    expirationWarningDays: preferences.preferences?.expirationWarningDays || 3,
    lowStockWarningEnabled: preferences.preferences?.notificationTypes?.includes('lowStock') !== false,
    notificationTypes: preferences.preferences?.notificationTypes || ['expiration', 'lowStock', 'shoppingReminder'],
    preferredTime: preferences.preferences?.preferredTime || '09:00',
    timezone: preferences.preferences?.timezone || 'America/New_York'
  };
  
  res.status(200).json(response);
});

// PUT /api/v1/notifications/settings
// Updates the notification settings for the authenticated user
router.put('/settings', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const updatedSettings = req.body;
  
  // Find existing preferences index
  const existingIndex = notification_preferences.findIndex(p => p.userId === userId);
  
  // Get user for email address
  const user = users.find(u => u.id === userId);
  const userEmail = user ? user.email : 'user@example.com';
  
  // Prepare the preferences object (support both flat and nested structures)
  const preferencesObj = {
    userId: userId,
    email: {
      enabled: updatedSettings.emailEnabled !== undefined ? updatedSettings.emailEnabled : (updatedSettings.email?.enabled || true),
      address: userEmail
    },
    inApp: {
      enabled: updatedSettings.pushEnabled !== undefined ? updatedSettings.pushEnabled : (updatedSettings.inApp?.enabled || true)
    },
    telegram: {
      enabled: updatedSettings.telegramEnabled !== undefined ? updatedSettings.telegramEnabled : (updatedSettings.telegram?.enabled || false),
      linked: updatedSettings.telegram?.linked || false,
      username: updatedSettings.telegram?.username || null
    },
    preferences: {
      expirationWarningDays: updatedSettings.expirationWarningDays !== undefined ? updatedSettings.expirationWarningDays : (updatedSettings.preferences?.expirationWarningDays || 3),
      notificationTypes: updatedSettings.lowStockWarningEnabled === false ? 
        ['expiration', 'shoppingReminder'] : 
        (updatedSettings.notificationTypes || updatedSettings.preferences?.notificationTypes || ['expiration', 'lowStock', 'shoppingReminder']),
      preferredTime: updatedSettings.preferredTime || updatedSettings.preferences?.preferredTime || '09:00',
      timezone: updatedSettings.timezone || updatedSettings.preferences?.timezone || user?.timezone || 'America/New_York'
    },
    updatedAt: new Date().toISOString()
  };
  
  // Ensure email address is always set from the user's email
  if (preferencesObj.email) {
    preferencesObj.email.address = userEmail;
  }
  
  // Update or create preferences
  if (existingIndex !== -1) {
    // Preserve telegram linked status if it exists
    const existing = notification_preferences[existingIndex];
    if (existing.telegram && existing.telegram.linked) {
      preferencesObj.telegram.linked = existing.telegram.linked;
      preferencesObj.telegram.username = existing.telegram.username;
    }
    notification_preferences[existingIndex] = preferencesObj;
  } else {
    notification_preferences.push(preferencesObj);
  }
  
  // Return success response
  res.status(200).json({
    message: 'Notification settings updated',
    updatedAt: preferencesObj.updatedAt
  });
});

// POST /api/v1/notifications/telegram/link
// Links a Telegram account to the user's notification settings
router.post('/telegram/link', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { verificationCode } = req.body;
  
  // Validate verification code presence
  if (!verificationCode) {
    return res.status(400).json({
      error: 'Invalid verification code',
      message: 'Verification code is required'
    });
  }
  
  // Mock validation - accept codes of 6-10 characters for testing
  if (verificationCode.length < 6 || verificationCode.length > 10) {
    return res.status(400).json({
      error: 'Invalid verification code',
      message: 'Verification code must be 6-10 characters'
    });
  }
  
  // Check if already linked (mock check)
  const existingPrefs = notification_preferences.find(p => p.userId === userId);
  if (existingPrefs && existingPrefs.telegram && existingPrefs.telegram.linked) {
    return res.status(409).json({
      error: 'Already linked to another account',
      message: 'Telegram account is already linked'
    });
  }
  
  // Mock successful link
  const telegramUsername = '@user' + verificationCode.toLowerCase();
  const linkedAt = new Date().toISOString();
  
  // Update or create preferences with Telegram link
  const prefIndex = notification_preferences.findIndex(p => p.userId === userId);
  if (prefIndex !== -1) {
    notification_preferences[prefIndex].telegram = {
      enabled: true,
      linked: true,
      username: telegramUsername
    };
    notification_preferences[prefIndex].updatedAt = linkedAt;
  } else {
    // Get user for default settings
    const user = users.find(u => u.id === userId);
    notification_preferences.push({
      userId: userId,
      email: {
        enabled: true,
        address: user ? user.email : 'user@example.com'
      },
      inApp: {
        enabled: true
      },
      telegram: {
        enabled: true,
        linked: true,
        username: telegramUsername
      },
      preferences: {
        expirationWarningDays: 3,
        notificationTypes: ['expiration', 'lowStock', 'shoppingReminder'],
        preferredTime: '09:00',
        timezone: user?.timezone || 'America/New_York'
      },
      updatedAt: linkedAt
    });
  }
  
  // Return success response
  res.status(200).json({
    success: true,
    linked: true,
    telegramUsername: telegramUsername,
    linkedAt: linkedAt
  });
});

module.exports = router;