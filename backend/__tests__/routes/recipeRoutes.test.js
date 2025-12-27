/**
 * Integration tests for Recipe Routes
 */

const express = require('express');
const request = require('supertest');

// Mock dependencies before requiring the router
jest.mock('../../authMiddleware', () => (req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

jest.mock('../../repositories', () => ({
  prisma: {
    householdMember: {
      findFirst: jest.fn(),
    },
    inventoryItem: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../lib/recipes', () => ({
  getRecipeService: jest.fn(),
  isRecipeServiceAvailable: jest.fn(),
}));

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { prisma } = require('../../repositories');
const { getRecipeService, isRecipeServiceAvailable } = require('../../lib/recipes');
const recipeRoutes = require('../../recipeRoutes');

describe('Recipe Routes', () => {
  let app;
  let mockRecipeService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRecipeService = {
      getProviderName: jest.fn().mockReturnValue('spoonacular'),
      findRecipesForInventory: jest.fn(),
      findRecipesForExpiring: jest.fn(),
      getRecipeDetails: jest.fn(),
      handleRecipeQuery: jest.fn(),
    };

    getRecipeService.mockReturnValue(mockRecipeService);

    app = express();
    app.use(express.json());
    app.use('/api/v1/recipes', recipeRoutes);
  });

  describe('GET /status', () => {
    it('should return service status when available', async () => {
      isRecipeServiceAvailable.mockReturnValue(true);

      const response = await request(app)
        .get('/api/v1/recipes/status')
        .expect(200);

      expect(response.body).toEqual({
        available: true,
        provider: 'spoonacular',
      });
    });

    it('should return unavailable status', async () => {
      isRecipeServiceAvailable.mockReturnValue(false);
      mockRecipeService.getProviderName.mockReturnValue('none');

      const response = await request(app)
        .get('/api/v1/recipes/status')
        .expect(200);

      expect(response.body.available).toBe(false);
    });
  });

  describe('GET /suggestions/:householdId', () => {
    const householdId = 'test-household-id';

    beforeEach(() => {
      prisma.householdMember.findFirst.mockResolvedValue({
        id: 'membership-id',
        householdId,
        userId: 'test-user-id',
      });

      prisma.inventoryItem.findMany.mockResolvedValue([
        { id: '1', name: 'Chicken', location: 'fridge' },
        { id: '2', name: 'Rice', location: 'pantry' },
      ]);

      isRecipeServiceAvailable.mockReturnValue(true);
    });

    it('should return 403 if user is not a member', async () => {
      prisma.householdMember.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/recipes/suggestions/${householdId}`)
        .expect(403);

      expect(response.body.error).toBe('Not a member of this household');
    });

    it('should return 503 if service not available', async () => {
      isRecipeServiceAvailable.mockReturnValue(false);

      const response = await request(app)
        .get(`/api/v1/recipes/suggestions/${householdId}`)
        .expect(503);

      expect(response.body.error).toBe('Recipe service not available');
    });

    it('should return message for empty inventory', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/recipes/suggestions/${householdId}`)
        .expect(200);

      expect(response.body.recipes).toEqual([]);
      expect(response.body.message).toContain('No items');
    });

    it('should return recipe suggestions', async () => {
      const mockRecipes = [
        { id: 1, title: 'Chicken Rice', usedIngredients: ['chicken', 'rice'] },
      ];
      mockRecipeService.findRecipesForInventory.mockResolvedValue(mockRecipes);

      const response = await request(app)
        .get(`/api/v1/recipes/suggestions/${householdId}`)
        .expect(200);

      expect(response.body.recipes).toEqual(mockRecipes);
      expect(response.body.provider).toBe('spoonacular');
      expect(response.body.inventoryCount).toBe(2);
    });

    it('should respect count parameter', async () => {
      mockRecipeService.findRecipesForInventory.mockResolvedValue([]);

      await request(app)
        .get(`/api/v1/recipes/suggestions/${householdId}?count=3`)
        .expect(200);

      expect(mockRecipeService.findRecipesForInventory).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ count: 3 })
      );
    });

    it('should respect prioritizeExpiring parameter', async () => {
      mockRecipeService.findRecipesForInventory.mockResolvedValue([]);

      await request(app)
        .get(`/api/v1/recipes/suggestions/${householdId}?prioritizeExpiring=false`)
        .expect(200);

      expect(mockRecipeService.findRecipesForInventory).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ prioritizeExpiring: false })
      );
    });

    it('should cap count at 10', async () => {
      mockRecipeService.findRecipesForInventory.mockResolvedValue([]);

      await request(app)
        .get(`/api/v1/recipes/suggestions/${householdId}?count=100`)
        .expect(200);

      expect(mockRecipeService.findRecipesForInventory).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ count: 10 })
      );
    });
  });

  describe('GET /expiring/:householdId', () => {
    const householdId = 'test-household-id';
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    beforeEach(() => {
      prisma.householdMember.findFirst.mockResolvedValue({
        id: 'membership-id',
        householdId,
        userId: 'test-user-id',
      });

      isRecipeServiceAvailable.mockReturnValue(true);
    });

    it('should return message for no expiring items', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/recipes/expiring/${householdId}`)
        .expect(200);

      expect(response.body.recipes).toEqual([]);
      expect(response.body.message).toContain('No items expiring');
      expect(response.body.expiringCount).toBe(0);
    });

    it('should return recipes for expiring items', async () => {
      const expiringItems = [
        { id: '1', name: 'Milk', expirationDate: tomorrow },
      ];
      prisma.inventoryItem.findMany.mockResolvedValue(expiringItems);

      const mockRecipes = [
        { id: 1, title: 'Milkshake', usedIngredients: ['milk'] },
      ];
      mockRecipeService.findRecipesForExpiring.mockResolvedValue(mockRecipes);

      const response = await request(app)
        .get(`/api/v1/recipes/expiring/${householdId}`)
        .expect(200);

      expect(response.body.recipes).toEqual(mockRecipes);
      expect(response.body.expiringItems).toHaveLength(1);
      expect(response.body.expiringItems[0].name).toBe('Milk');
      expect(response.body.expiringCount).toBe(1);
    });

    it('should respect days parameter', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      await request(app)
        .get(`/api/v1/recipes/expiring/${householdId}?days=7`)
        .expect(200);

      const call = prisma.inventoryItem.findMany.mock.calls[0][0];
      expect(call.where.expirationDate.lte).toBeDefined();
    });
  });

  describe('GET /:recipeId', () => {
    it('should reject LLM recipe IDs', async () => {
      const response = await request(app)
        .get('/api/v1/recipes/llm-12345')
        .expect(400);

      expect(response.body.error).toBe('Detailed view not available');
    });

    it('should return 503 if Spoonacular not configured', async () => {
      mockRecipeService.getProviderName.mockReturnValue('llm');

      const response = await request(app)
        .get('/api/v1/recipes/12345')
        .expect(503);

      expect(response.body.error).toBe('Spoonacular not configured');
    });

    it('should return recipe details', async () => {
      const mockDetails = {
        id: 12345,
        title: 'Amazing Recipe',
        readyInMinutes: 30,
      };
      mockRecipeService.getRecipeDetails.mockResolvedValue(mockDetails);

      const response = await request(app)
        .get('/api/v1/recipes/12345')
        .expect(200);

      expect(response.body).toEqual(mockDetails);
    });
  });

  describe('POST /query', () => {
    beforeEach(() => {
      prisma.householdMember.findFirst.mockResolvedValue({
        id: 'membership-id',
        householdId: 'test-household',
        userId: 'test-user-id',
      });

      prisma.inventoryItem.findMany.mockResolvedValue([
        { id: '1', name: 'Chicken' },
      ]);

      isRecipeServiceAvailable.mockReturnValue(true);
    });

    it('should require query and householdId', async () => {
      const response = await request(app)
        .post('/api/v1/recipes/query')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return query response', async () => {
      const mockResult = {
        response: 'Here are some recipes:',
        recipes: [{ id: 1, title: 'Recipe' }],
      };
      mockRecipeService.handleRecipeQuery.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/recipes/query')
        .send({ query: 'What can I make?', householdId: 'test-household' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
    });

    it('should return 403 if not a household member', async () => {
      prisma.householdMember.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/recipes/query')
        .send({ query: 'What can I make?', householdId: 'test-household' })
        .expect(403);

      expect(response.body.error).toBe('Not a member of this household');
    });
  });
});
