const express = require('express');
const router = express.Router();
const authMiddleware = require('./authMiddleware');
const { userRepository, notificationRepository, householdRepository } = require('./repositories');
const { prisma } = require('./repositories');
const { logger } = require('./lib/logger');
const { getRecipeService, isRecipeServiceAvailable } = require('./lib/recipes');

// GET /api/v1/notifications/settings
// Returns the notification settings for the authenticated user
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user for email
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get preferences from database
    let preferences = await notificationRepository.getPreferences(userId);

    // If no preferences exist, return default settings
    if (!preferences) {
      preferences = {
        emailEnabled: true,
        emailAddress: user.email,
        inAppEnabled: true,
        telegramEnabled: false,
        telegramLinked: false,
        telegramUsername: null,
        expirationWarningDays: 3,
        lowStockWarningEnabled: true,
        preferredTime: '09:00',
        timezone: user.timezone || 'America/New_York'
      };
    }

    // Return the preferences in a flat structure for compatibility
    res.status(200).json({
      emailEnabled: preferences.emailEnabled ?? true,
      emailAddress: preferences.emailAddress || user.email,
      pushEnabled: preferences.inAppEnabled ?? true,
      telegramEnabled: preferences.telegramEnabled ?? false,
      telegramLinked: preferences.telegramLinked ?? false,
      telegramUsername: preferences.telegramUsername || null,
      expirationWarningDays: preferences.expirationWarningDays ?? 3,
      lowStockWarningEnabled: preferences.lowStockWarningEnabled ?? true,
      notificationTypes: ['expiration', 'lowStock', 'shoppingReminder'],
      preferredTime: preferences.preferredTime || '09:00',
      timezone: preferences.timezone || user.timezone || 'America/New_York'
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to get notification settings');
    res.status(500).json({ message: 'An error occurred while fetching notification settings' });
  }
});

// PUT /api/v1/notifications/settings
// Updates the notification settings for the authenticated user
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedSettings = req.body;

    // Get user for email
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build update data
    const updateData = {
      emailEnabled: updatedSettings.emailEnabled ?? true,
      emailAddress: user.email, // Always use user's email
      inAppEnabled: updatedSettings.pushEnabled ?? updatedSettings.inAppEnabled ?? true,
      telegramEnabled: updatedSettings.telegramEnabled ?? false,
      expirationWarningDays: updatedSettings.expirationWarningDays ?? 3,
      lowStockWarningEnabled: updatedSettings.lowStockWarningEnabled ?? true,
      preferredTime: updatedSettings.preferredTime || '09:00',
      timezone: updatedSettings.timezone || user.timezone || 'America/New_York'
    };

    // Upsert preferences
    await notificationRepository.upsertPreferences(userId, updateData);

    res.status(200).json({
      message: 'Notification settings updated',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to update notification settings');
    res.status(500).json({ message: 'An error occurred while updating notification settings' });
  }
});

// POST /api/v1/notifications/telegram/link
// Links a Telegram account to the user's notification settings
router.post('/telegram/link', authMiddleware, async (req, res) => {
  try {
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

    // Check if already linked
    const existingPrefs = await notificationRepository.getPreferences(userId);
    if (existingPrefs && existingPrefs.telegramLinked) {
      return res.status(409).json({
        error: 'Already linked to another account',
        message: 'Telegram account is already linked'
      });
    }

    // Get user for default settings
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mock successful link
    const telegramUsername = '@user' + verificationCode.toLowerCase();
    const telegramChatId = 'chat_' + verificationCode;
    const linkedAt = new Date().toISOString();

    // Ensure preferences exist first
    if (!existingPrefs) {
      await notificationRepository.upsertPreferences(userId, {
        emailEnabled: true,
        emailAddress: user.email,
        inAppEnabled: true,
        telegramEnabled: true,
        expirationWarningDays: 3,
        lowStockWarningEnabled: true,
        preferredTime: '09:00',
        timezone: user.timezone || 'America/New_York'
      });
    }

    // Link Telegram
    await notificationRepository.linkTelegram(userId, telegramChatId, telegramUsername);

    res.status(200).json({
      success: true,
      linked: true,
      telegramUsername: telegramUsername,
      linkedAt: linkedAt
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to link Telegram account');
    res.status(500).json({ message: 'An error occurred while linking Telegram' });
  }
});

// GET /api/v1/notifications
// Get user's notification history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, unreadOnly } = req.query;

    const result = await notificationRepository.findUserNotifications(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      notifications: result.notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        channel: n.channel,
        read: !!n.readAt,
        readAt: n.readAt?.toISOString() || null,
        createdAt: n.createdAt.toISOString()
      })),
      total: result.total,
      hasMore: result.total > parseInt(offset) + result.notifications.length
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to get notifications');
    res.status(500).json({ message: 'An error occurred while fetching notifications' });
  }
});

// GET /api/v1/notifications/unread-count
// Get count of unread notifications
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationRepository.getUnreadCount(userId);

    res.json({ count });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to get unread notification count');
    res.status(500).json({ message: 'An error occurred while fetching unread count' });
  }
});

// POST /api/v1/notifications/:id/read
// Mark a notification as read
router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await notificationRepository.markAsRead(id, userId);

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id, notificationId: req.params.id }, 'Failed to mark notification as read');
    res.status(500).json({ message: 'An error occurred while marking notification as read' });
  }
});

// POST /api/v1/notifications/read-all
// Mark all notifications as read
router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await notificationRepository.markAllAsRead(userId);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, userId: req.user?.id }, 'Failed to mark all notifications as read');
    res.status(500).json({ message: 'An error occurred while marking notifications as read' });
  }
});

// GET /api/v1/notifications/recipe-suggestions/:householdId
// Get recipe suggestions for expiring items and create a notification
router.get('/recipe-suggestions/:householdId', authMiddleware, async (req, res) => {
  try {
    const { householdId } = req.params;
    const userId = req.user.id;

    // Verify membership
    const membership = await prisma.householdMember.findFirst({
      where: { householdId, userId },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this household' });
    }

    if (!isRecipeServiceAvailable()) {
      return res.status(503).json({
        error: 'Recipe service not available',
        message: 'Configure SPOONACULAR_API_KEY or an LLM provider',
      });
    }

    // Get expiring items (within 3 days)
    const expirationThreshold = new Date();
    expirationThreshold.setDate(expirationThreshold.getDate() + 3);

    const expiringItems = await prisma.inventoryItem.findMany({
      where: {
        householdId,
        expirationDate: {
          lte: expirationThreshold,
          gte: new Date(),
        },
      },
      orderBy: { expirationDate: 'asc' },
    });

    if (expiringItems.length === 0) {
      return res.json({
        message: 'No expiring items',
        recipes: [],
        notification: null,
      });
    }

    // Get recipe suggestions
    const recipeService = getRecipeService();
    const recipes = await recipeService.findRecipesForExpiring(expiringItems, { count: 3 });

    if (recipes.length === 0) {
      return res.json({
        message: 'No recipes found',
        expiringItems: expiringItems.map(i => i.name),
        recipes: [],
        notification: null,
      });
    }

    // Create a notification
    const expiringNames = expiringItems.slice(0, 3).map(i => i.name).join(', ');
    const recipeNames = recipes.slice(0, 2).map(r => r.title).join(' or ');

    const notification = await notificationRepository.create({
      userId,
      type: 'recipe_suggestion',
      title: 'Recipe ideas for expiring items',
      message: `Your ${expiringNames} ${expiringItems.length === 1 ? 'is' : 'are'} expiring soon! Try making ${recipeNames}.`,
      channel: 'in_app',
      metadata: {
        householdId,
        expiringItemIds: expiringItems.map(i => i.id),
        recipeIds: recipes.map(r => r.id),
      },
    });

    res.json({
      expiringItems: expiringItems.map(i => ({
        id: i.id,
        name: i.name,
        expirationDate: i.expirationDate,
      })),
      recipes,
      notification: notification ? {
        id: notification.id,
        title: notification.title,
        message: notification.message,
      } : null,
    });
  } catch (error) {
    const log = req.log || logger;
    log.error({ err: error, householdId: req.params.householdId }, 'Failed to get recipe suggestions');
    res.status(500).json({ message: 'An error occurred while getting recipe suggestions' });
  }
});

module.exports = router;
