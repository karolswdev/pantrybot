/**
 * Tests for LLM Recipe Service
 */

const { LLMRecipeService, getLLMRecipeService } = require('../../../lib/recipes/llm-recipes');

// Mock the LLM provider factory
jest.mock('../../../lib/llm/provider-factory', () => ({
  getProvider: jest.fn(),
  isLLMConfigured: jest.fn(),
}));

const { getProvider, isLLMConfigured } = require('../../../lib/llm/provider-factory');

describe('LLMRecipeService', () => {
  let service;
  let mockProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider = {
      chat: jest.fn(),
    };
    service = new LLMRecipeService();
  });

  describe('isAvailable', () => {
    it('should return true when LLM is configured', () => {
      isLLMConfigured.mockReturnValue(true);
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when LLM is not configured', () => {
      isLLMConfigured.mockReturnValue(false);
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('suggestRecipes', () => {
    const mockRecipes = [
      {
        title: 'Chicken Stir Fry',
        description: 'Quick and easy stir fry',
        readyInMinutes: 25,
        servings: 4,
        usedIngredients: ['chicken', 'vegetables'],
        additionalIngredients: ['soy sauce', 'oil'],
        instructions: ['Cut chicken', 'Stir fry vegetables', 'Add sauce'],
        difficulty: 'easy',
      },
      {
        title: 'Chicken Salad',
        description: 'Fresh and healthy',
        readyInMinutes: 15,
        servings: 2,
        usedIngredients: ['chicken', 'lettuce'],
        additionalIngredients: ['dressing'],
        instructions: ['Shred chicken', 'Mix with lettuce', 'Add dressing'],
        difficulty: 'easy',
      },
    ];

    beforeEach(() => {
      isLLMConfigured.mockReturnValue(true);
      getProvider.mockReturnValue(mockProvider);

      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'suggest_recipes',
          arguments: { recipes: mockRecipes },
        }],
      });
    });

    it('should throw error when LLM not configured', async () => {
      isLLMConfigured.mockReturnValue(false);

      const ingredients = [{ name: 'chicken' }];
      await expect(service.suggestRecipes(ingredients))
        .rejects.toThrow('No LLM provider configured');
    });

    it('should call LLM with correct prompt structure', async () => {
      const ingredients = [
        { name: 'Chicken', expirationDate: null },
        { name: 'Rice', expirationDate: null },
      ];

      await service.suggestRecipes(ingredients, { count: 2 });

      expect(mockProvider.chat).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        expect.objectContaining({
          temperature: 0.7,
          tools: expect.any(Array),
        })
      );

      const userMessage = mockProvider.chat.mock.calls[0][0][1].content;
      expect(userMessage).toContain('Chicken');
      expect(userMessage).toContain('Rice');
      expect(userMessage).toContain('2 recipes');
    });

    it('should prioritize expiring items in prompt', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ingredients = [
        { name: 'Chicken', expirationDate: tomorrow.toISOString() },
        { name: 'Rice', expirationDate: null },
      ];

      await service.suggestRecipes(ingredients);

      const userMessage = mockProvider.chat.mock.calls[0][0][1].content;
      expect(userMessage).toContain('Chicken');
      expect(userMessage).toContain('expiring soon');
    });

    it('should include dietary restrictions in prompt', async () => {
      const ingredients = [{ name: 'Vegetables' }];

      await service.suggestRecipes(ingredients, {
        dietaryRestrictions: ['vegetarian', 'gluten-free'],
      });

      const userMessage = mockProvider.chat.mock.calls[0][0][1].content;
      expect(userMessage).toContain('vegetarian');
      expect(userMessage).toContain('gluten-free');
    });

    it('should include meal type in prompt', async () => {
      const ingredients = [{ name: 'Eggs' }];

      await service.suggestRecipes(ingredients, { mealType: 'breakfast' });

      const userMessage = mockProvider.chat.mock.calls[0][0][1].content;
      expect(userMessage).toContain('breakfast');
    });

    it('should transform LLM response to recipe format', async () => {
      const ingredients = [{ name: 'Chicken' }];
      const result = await service.suggestRecipes(ingredients);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: expect.stringMatching(/^llm-/),
        title: 'Chicken Stir Fry',
        description: 'Quick and easy stir fry',
        readyInMinutes: 25,
        servings: 4,
        usedIngredients: ['chicken', 'vegetables'],
        instructions: expect.any(Array),
        difficulty: 'easy',
        source: 'llm',
      });
    });

    it('should return empty array when LLM returns no tool calls', async () => {
      mockProvider.chat.mockResolvedValue({
        content: 'I cannot suggest recipes without more ingredients.',
      });

      const ingredients = [{ name: 'Salt' }];
      const result = await service.suggestRecipes(ingredients);

      expect(result).toEqual([]);
    });

    it('should handle LLM errors gracefully', async () => {
      mockProvider.chat.mockRejectedValue(new Error('API rate limit'));

      const ingredients = [{ name: 'Chicken' }];
      await expect(service.suggestRecipes(ingredients))
        .rejects.toThrow('API rate limit');
    });

    it('should use default count of 3', async () => {
      const ingredients = [{ name: 'Chicken' }];
      await service.suggestRecipes(ingredients);

      const userMessage = mockProvider.chat.mock.calls[0][0][1].content;
      expect(userMessage).toContain('3 recipes');
    });

    it('should add default values for missing recipe fields', async () => {
      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'suggest_recipes',
          arguments: {
            recipes: [{
              title: 'Simple Dish',
              usedIngredients: ['ingredient'],
              instructions: ['Cook it'],
            }],
          },
        }],
      });

      const ingredients = [{ name: 'ingredient' }];
      const result = await service.suggestRecipes(ingredients);

      expect(result[0].readyInMinutes).toBe(30);
      expect(result[0].servings).toBe(4);
      expect(result[0].difficulty).toBe('medium');
      expect(result[0].additionalIngredients).toEqual([]);
    });
  });

  describe('getDetailedRecipe', () => {
    beforeEach(() => {
      isLLMConfigured.mockReturnValue(true);
      getProvider.mockReturnValue(mockProvider);

      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'suggest_recipes',
          arguments: {
            recipes: [{
              title: 'Detailed Recipe',
              description: 'A detailed recipe',
              usedIngredients: ['chicken'],
              instructions: ['Step 1', 'Step 2'],
            }],
          },
        }],
      });
    });

    it('should return single detailed recipe', async () => {
      const result = await service.getDetailedRecipe(['chicken', 'rice']);

      expect(result).toBeDefined();
      expect(result.title).toBe('Detailed Recipe');
    });

    it('should return null when no recipe found', async () => {
      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'suggest_recipes',
          arguments: { recipes: [] },
        }],
      });

      const result = await service.getDetailedRecipe(['nothing']);
      expect(result).toBeNull();
    });
  });

  describe('_daysUntilExpiration', () => {
    it('should calculate days correctly', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(service._daysUntilExpiration(tomorrow)).toBe(1);

      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(service._daysUntilExpiration(nextWeek)).toBe(7);
    });

    it('should handle string dates', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(service._daysUntilExpiration(tomorrow.toISOString())).toBe(1);
    });

    it('should return negative for past dates', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(service._daysUntilExpiration(yesterday)).toBeLessThan(0);
    });
  });
});

describe('getLLMRecipeService', () => {
  it('should return singleton instance', () => {
    const instance1 = getLLMRecipeService();
    const instance2 = getLLMRecipeService();
    expect(instance1).toBe(instance2);
  });
});
