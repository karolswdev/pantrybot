/**
 * Recipe Routes
 *
 * Endpoints for recipe suggestions based on household inventory.
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('./authMiddleware');
const { logger } = require('./lib/logger');
const { getRecipeService, isRecipeServiceAvailable } = require('./lib/recipes');
const { prisma } = require('./repositories');

/**
 * GET /api/v1/recipes/status
 * Check if recipe service is available
 */
router.get('/status', async (req, res) => {
  const service = getRecipeService();

  res.json({
    available: isRecipeServiceAvailable(),
    provider: service.getProviderName(),
  });
});

/**
 * GET /api/v1/recipes/suggestions/:householdId
 * Get recipe suggestions based on household inventory
 *
 * Query params:
 *   - count: Number of recipes (default 5, max 10)
 *   - prioritizeExpiring: Whether to prioritize expiring items (default true)
 */
router.get('/suggestions/:householdId', authMiddleware, async (req, res) => {
  try {
    const { householdId } = req.params;
    const { count = 5, prioritizeExpiring = 'true' } = req.query;

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

    if (!isRecipeServiceAvailable()) {
      return res.status(503).json({
        error: 'Recipe service not available',
        message: 'Configure SPOONACULAR_API_KEY or an LLM provider',
      });
    }

    // Get household inventory
    const items = await prisma.inventoryItem.findMany({
      where: { householdId },
      orderBy: { expirationDate: 'asc' },
    });

    if (items.length === 0) {
      return res.json({
        recipes: [],
        message: 'No items in inventory to suggest recipes for',
      });
    }

    const service = getRecipeService();
    const recipes = await service.findRecipesForInventory(items, {
      count: Math.min(parseInt(count, 10) || 5, 10),
      prioritizeExpiring: prioritizeExpiring !== 'false',
    });

    res.json({
      recipes,
      provider: service.getProviderName(),
      inventoryCount: items.length,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get recipe suggestions');
    res.status(500).json({ error: 'Failed to get recipe suggestions' });
  }
});

/**
 * GET /api/v1/recipes/expiring/:householdId
 * Get recipe suggestions specifically for expiring items
 *
 * Query params:
 *   - days: Days threshold for expiring (default 3)
 *   - count: Number of recipes (default 3)
 */
router.get('/expiring/:householdId', authMiddleware, async (req, res) => {
  try {
    const { householdId } = req.params;
    const { days = 3, count = 3 } = req.query;

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

    if (!isRecipeServiceAvailable()) {
      return res.status(503).json({
        error: 'Recipe service not available',
        message: 'Configure SPOONACULAR_API_KEY or an LLM provider',
      });
    }

    // Get expiring items
    const expirationThreshold = new Date();
    expirationThreshold.setDate(expirationThreshold.getDate() + parseInt(days, 10));

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
        recipes: [],
        message: `No items expiring in the next ${days} days`,
        expiringCount: 0,
      });
    }

    const service = getRecipeService();
    const recipes = await service.findRecipesForExpiring(expiringItems, {
      count: Math.min(parseInt(count, 10) || 3, 10),
    });

    res.json({
      recipes,
      provider: service.getProviderName(),
      expiringItems: expiringItems.map(i => ({
        name: i.name,
        expirationDate: i.expirationDate,
      })),
      expiringCount: expiringItems.length,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get expiring recipes');
    res.status(500).json({ error: 'Failed to get recipe suggestions' });
  }
});

/**
 * GET /api/v1/recipes/:recipeId
 * Get detailed recipe information (Spoonacular only)
 */
router.get('/:recipeId', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;

    if (recipeId.startsWith('llm-')) {
      return res.status(400).json({
        error: 'Detailed view not available',
        message: 'LLM-generated recipes do not have detailed views',
      });
    }

    const service = getRecipeService();

    if (service.getProviderName() !== 'spoonacular') {
      return res.status(503).json({
        error: 'Spoonacular not configured',
        message: 'Detailed recipe view requires Spoonacular API',
      });
    }

    const details = await service.getRecipeDetails(recipeId);
    res.json(details);
  } catch (error) {
    logger.error({ error: error.message, recipeId: req.params.recipeId }, 'Failed to get recipe details');
    res.status(500).json({ error: 'Failed to get recipe details' });
  }
});

/**
 * POST /api/v1/recipes/query
 * Natural language recipe query
 *
 * Body:
 *   - query: string - Natural language query
 *   - householdId: string - Household ID
 */
router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { query, householdId } = req.body;

    if (!query || !householdId) {
      return res.status(400).json({ error: 'Query and householdId are required' });
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

    if (!isRecipeServiceAvailable()) {
      return res.status(503).json({
        error: 'Recipe service not available',
      });
    }

    // Get household inventory
    const items = await prisma.inventoryItem.findMany({
      where: { householdId },
      orderBy: { expirationDate: 'asc' },
    });

    const service = getRecipeService();
    const result = await service.handleRecipeQuery(query, items);

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to process recipe query');
    res.status(500).json({ error: 'Failed to process query' });
  }
});

module.exports = router;
