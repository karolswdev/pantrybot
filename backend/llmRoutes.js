/**
 * LLM Routes
 *
 * Endpoints for conversational inventory management.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./authMiddleware');
const { logger } = require('./lib/logger');
const {
  InventoryIntentProcessor,
  buildInventorySummary,
  isLLMConfigured,
  getProviderInfo,
} = require('./lib/llm');
const { prisma } = require('./repositories');

// Initialize processor (lazy - will be created on first use)
let processor = null;

function getProcessor() {
  if (!processor) {
    processor = new InventoryIntentProcessor();
  }
  return processor;
}

/**
 * GET /api/v1/llm/status
 * Check if LLM is configured and available
 */
router.get('/status', async (req, res) => {
  try {
    const configured = isLLMConfigured();
    const providerInfo = getProviderInfo();

    if (!configured) {
      return res.json({
        available: false,
        message: 'No LLM provider configured',
        hint: 'Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_BASE_URL',
      });
    }

    // Try to check if provider is actually available
    let providerAvailable = false;
    try {
      const proc = getProcessor();
      const provider = proc._getProvider();
      providerAvailable = await provider.isAvailable();
    } catch (e) {
      logger.warn({ error: e.message }, 'Provider availability check failed');
    }

    res.json({
      available: providerAvailable,
      configured: true,
      provider: providerInfo.provider,
      source: providerInfo.source,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to check LLM status');
    res.status(500).json({ error: 'Failed to check LLM status' });
  }
});

/**
 * POST /api/v1/llm/process
 * Process a natural language message for inventory actions
 *
 * Body:
 *   - message: string (required) - The user's message
 *   - householdId: string (required) - Household context
 *   - executeActions: boolean (optional) - Whether to execute parsed actions (default: true)
 */
router.post('/process', authenticateToken, async (req, res) => {
  try {
    const { message, householdId, executeActions = true } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!householdId) {
      return res.status(400).json({ error: 'Household ID is required' });
    }

    // Verify user has access to household
    const membership = await prisma.householdMember.findFirst({
      where: {
        householdId,
        userId: req.user.id,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this household' });
    }

    // Build household context
    const items = await prisma.inventoryItem.findMany({
      where: { householdId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    const context = {
      householdId,
      inventorySummary: buildInventorySummary(items),
      recentItems: items.slice(0, 10).map(i => i.name),
    };

    // Process the message
    const proc = getProcessor();
    const intent = await proc.process(message, context);

    // Execute actions if requested
    let executionResult = null;
    if (executeActions && intent.action !== 'unknown' && intent.action !== 'query') {
      executionResult = await executeIntent(intent, householdId, req.user.id);
    }

    res.json({
      intent,
      executed: executeActions && executionResult !== null,
      result: executionResult,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to process LLM message');

    if (error.message.includes('No LLM provider')) {
      return res.status(503).json({
        error: 'LLM not configured',
        message: 'Natural language processing is not available',
      });
    }

    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Execute a parsed inventory intent
 * @param {Object} intent - Parsed intent from LLM
 * @param {string} householdId - Household ID
 * @param {string} userId - User ID
 * @returns {Object} Execution result
 */
async function executeIntent(intent, householdId, userId) {
  const results = {
    action: intent.action,
    itemsProcessed: 0,
    errors: [],
  };

  switch (intent.action) {
    case 'add':
      for (const item of intent.items) {
        try {
          // Calculate expiration date
          const expirationDate = item.expirationDays
            ? new Date(Date.now() + item.expirationDays * 24 * 60 * 60 * 1000)
            : null;

          await prisma.inventoryItem.create({
            data: {
              name: item.name,
              quantity: item.quantity || 1,
              unit: item.unit || 'item',
              location: item.location || 'fridge',
              category: item.category,
              expirationDate,
              householdId,
              addedById: userId,
            },
          });
          results.itemsProcessed++;
        } catch (e) {
          logger.warn({ item: item.name, error: e.message }, 'Failed to add item');
          results.errors.push({ item: item.name, error: e.message });
        }
      }
      break;

    case 'consume':
      for (const item of intent.items) {
        try {
          // Find matching item in inventory
          const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
              householdId,
              name: { contains: item.name, mode: 'insensitive' },
            },
          });

          if (!inventoryItem) {
            results.errors.push({ item: item.name, error: 'Item not found' });
            continue;
          }

          const consumeQuantity = item.quantity || inventoryItem.quantity;
          const remaining = inventoryItem.quantity - consumeQuantity;

          if (remaining <= 0) {
            // Delete the item entirely
            await prisma.inventoryItem.delete({
              where: { id: inventoryItem.id },
            });
          } else {
            // Update quantity
            await prisma.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: remaining },
            });
          }

          // Log consumption
          await prisma.consumptionLog.create({
            data: {
              itemId: inventoryItem.id,
              quantity: consumeQuantity,
              userId,
            },
          });

          results.itemsProcessed++;
        } catch (e) {
          logger.warn({ item: item.name, error: e.message }, 'Failed to consume item');
          results.errors.push({ item: item.name, error: e.message });
        }
      }
      break;

    case 'waste':
      for (const item of intent.items) {
        try {
          // Find matching item in inventory
          const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
              householdId,
              name: { contains: item.name, mode: 'insensitive' },
            },
          });

          if (!inventoryItem) {
            results.errors.push({ item: item.name, error: 'Item not found' });
            continue;
          }

          const wasteQuantity = item.quantity || inventoryItem.quantity;
          const remaining = inventoryItem.quantity - wasteQuantity;

          if (remaining <= 0) {
            // Delete the item entirely
            await prisma.inventoryItem.delete({
              where: { id: inventoryItem.id },
            });
          } else {
            // Update quantity
            await prisma.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: remaining },
            });
          }

          // Log waste
          await prisma.wasteLog.create({
            data: {
              itemId: inventoryItem.id,
              quantity: wasteQuantity,
              reason: item.reason || 'expired',
              userId,
            },
          });

          results.itemsProcessed++;
        } catch (e) {
          logger.warn({ item: item.name, error: e.message }, 'Failed to waste item');
          results.errors.push({ item: item.name, error: e.message });
        }
      }
      break;

    default:
      logger.warn({ action: intent.action }, 'Unknown action type');
  }

  return results;
}

/**
 * POST /api/v1/llm/chat
 * Simple chat endpoint for testing/debugging
 * Does NOT execute actions, just returns parsed intent
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, householdId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build minimal context
    let context = { householdId };

    if (householdId) {
      const items = await prisma.inventoryItem.findMany({
        where: { householdId },
        take: 50,
      });
      context.inventorySummary = buildInventorySummary(items);
    }

    const proc = getProcessor();
    const intent = await proc.process(message, context);

    res.json({
      message,
      intent,
      response: intent.response,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Chat processing failed');
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

module.exports = router;
