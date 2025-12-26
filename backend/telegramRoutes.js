/**
 * Telegram Webhook Routes
 *
 * Handles incoming updates from Telegram via webhook.
 */

const express = require('express');
const router = express.Router();
const { getBot } = require('./services/telegram');
const { logger } = require('./lib/logger');
const authMiddleware = require('./authMiddleware');
const { prisma } = require('./repositories');
const crypto = require('crypto');

/**
 * POST /api/v1/telegram/webhook
 * Receive updates from Telegram
 */
router.post('/webhook', async (req, res) => {
  const bot = getBot();

  if (!bot.isConfigured()) {
    logger.warn('Telegram webhook called but bot not configured');
    return res.status(200).send('OK');
  }

  try {
    // Handle the update asynchronously
    bot.handleUpdate(req.body).catch(error => {
      logger.error({ error: error.message }, 'Error handling Telegram update');
    });

    // Always respond quickly to Telegram
    res.status(200).send('OK');
  } catch (error) {
    logger.error({ error: error.message }, 'Telegram webhook error');
    res.status(200).send('OK'); // Still respond OK to avoid retries
  }
});

/**
 * GET /api/v1/telegram/status
 * Check Telegram bot status
 */
router.get('/status', async (req, res) => {
  const bot = getBot();

  if (!bot.isConfigured()) {
    return res.json({
      configured: false,
      message: 'TELEGRAM_BOT_TOKEN not set',
    });
  }

  try {
    const me = await bot.getMe();
    res.json({
      configured: true,
      bot: {
        id: me.id,
        username: me.username,
        firstName: me.first_name,
      },
    });
  } catch (error) {
    res.json({
      configured: true,
      available: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/telegram/setup-webhook
 * Set up the webhook (admin only)
 */
router.post('/setup-webhook', authMiddleware, async (req, res) => {
  const { webhookUrl } = req.body;
  const bot = getBot();

  if (!bot.isConfigured()) {
    return res.status(503).json({ error: 'Telegram bot not configured' });
  }

  try {
    await bot.setWebhook(webhookUrl);
    res.json({ success: true, message: 'Webhook configured' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to set webhook');
    res.status(500).json({ error: 'Failed to set webhook' });
  }
});

/**
 * POST /api/v1/telegram/generate-link-code
 * Generate a link code for connecting Telegram account
 */
router.post('/generate-link-code', authMiddleware, async (req, res) => {
  try {
    // Generate a random 8-character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing unused codes for this user
    await prisma.telegramLink.deleteMany({
      where: {
        userId: req.user.id,
        used: false,
      },
    });

    // Create new link code
    const link = await prisma.telegramLink.create({
      data: {
        code,
        userId: req.user.id,
        expiresAt,
        used: false,
      },
    });

    res.json({
      code: link.code,
      expiresAt: link.expiresAt,
      instructions: `Send this code to @PantrybotBot on Telegram: /link ${link.code}`,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate link code');
    res.status(500).json({ error: 'Failed to generate link code' });
  }
});

/**
 * GET /api/v1/telegram/link-status
 * Check if user's Telegram is linked
 */
router.get('/link-status', authMiddleware, async (req, res) => {
  try {
    const link = await prisma.telegramLink.findFirst({
      where: {
        userId: req.user.id,
        used: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (link) {
      res.json({
        linked: true,
        telegramId: link.telegramId,
        linkedAt: link.updatedAt,
      });
    } else {
      res.json({
        linked: false,
      });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to check link status');
    res.status(500).json({ error: 'Failed to check link status' });
  }
});

/**
 * DELETE /api/v1/telegram/unlink
 * Unlink Telegram account
 */
router.delete('/unlink', authMiddleware, async (req, res) => {
  try {
    await prisma.telegramLink.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    res.json({ success: true, message: 'Telegram account unlinked' });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to unlink Telegram');
    res.status(500).json({ error: 'Failed to unlink Telegram' });
  }
});

module.exports = router;
