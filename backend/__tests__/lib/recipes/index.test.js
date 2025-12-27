/**
 * Tests for Unified Recipe Service
 */

const { RecipeService, getRecipeService, isRecipeServiceAvailable } = require('../../../lib/recipes');

// Mock the individual services
jest.mock('../../../lib/recipes/spoonacular', () => ({
  getSpoonacularService: jest.fn(),
  isSpoonacularConfigured: jest.fn(),
}));

jest.mock('../../../lib/recipes/llm-recipes', () => ({
  getLLMRecipeService: jest.fn(),
}));

jest.mock('../../../lib/llm/provider-factory', () => ({
  isLLMConfigured: jest.fn(),
}));

const { getSpoonacularService, isSpoonacularConfigured } = require('../../../lib/recipes/spoonacular');
const { getLLMRecipeService } = require('../../../lib/recipes/llm-recipes');
const { isLLMConfigured } = require('../../../lib/llm/provider-factory');

describe('RecipeService', () => {
  let service;
  let mockSpoonacular;
  let mockLLMService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSpoonacular = {
      findByIngredients: jest.fn(),
      getRecipeDetails: jest.fn(),
    };

    mockLLMService = {
      suggestRecipes: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true),
    };

    getSpoonacularService.mockReturnValue(mockSpoonacular);
    getLLMRecipeService.mockReturnValue(mockLLMService);

    service = new RecipeService();
  });

  describe('isAvailable', () => {
    it('should return true when Spoonacular is configured', () => {
      isSpoonacularConfigured.mockReturnValue(true);
      isLLMConfigured.mockReturnValue(false);

      expect(service.isAvailable()).toBe(true);
    });

    it('should return true when LLM is configured', () => {
      isSpoonacularConfigured.mockReturnValue(false);
      isLLMConfigured.mockReturnValue(true);

      expect(service.isAvailable()).toBe(true);
    });

    it('should return true when both are configured', () => {
      isSpoonacularConfigured.mockReturnValue(true);
      isLLMConfigured.mockReturnValue(true);

      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when neither is configured', () => {
      isSpoonacularConfigured.mockReturnValue(false);
      isLLMConfigured.mockReturnValue(false);

      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('getProviderName', () => {
    it('should return spoonacular when configured', () => {
      isSpoonacularConfigured.mockReturnValue(true);
      expect(service.getProviderName()).toBe('spoonacular');
    });

    it('should return llm when only LLM is configured', () => {
      isSpoonacularConfigured.mockReturnValue(false);
      isLLMConfigured.mockReturnValue(true);
      expect(service.getProviderName()).toBe('llm');
    });

    it('should return none when nothing is configured', () => {
      isSpoonacularConfigured.mockReturnValue(false);
      isLLMConfigured.mockReturnValue(false);
      expect(service.getProviderName()).toBe('none');
    });
  });

  describe('findRecipesForInventory', () => {
    const mockInventory = [
      { name: 'Chicken', location: 'fridge', expirationDate: null },
      { name: 'Rice', location: 'pantry', expirationDate: null },
    ];

    const mockSpoonacularRecipes = [
      {
        id: 1,
        title: 'Chicken Rice Bowl',
        usedIngredientCount: 2,
        missedIngredientCount: 1,
        usedIngredients: ['chicken', 'rice'],
        missedIngredients: ['soy sauce'],
      },
    ];

    const mockLLMRecipes = [
      {
        id: 'llm-123',
        title: 'Simple Chicken Rice',
        usedIngredients: ['chicken', 'rice'],
        source: 'llm',
      },
    ];

    it('should return empty array for empty inventory', async () => {
      const result = await service.findRecipesForInventory([]);
      expect(result).toEqual([]);
    });

    it('should use Spoonacular when configured', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockResolvedValue(mockSpoonacularRecipes);

      const result = await service.findRecipesForInventory(mockInventory);

      expect(mockSpoonacular.findByIngredients).toHaveBeenCalledWith(
        ['Chicken', 'Rice'],
        expect.objectContaining({ number: 5 })
      );
      expect(result[0].source).toBe('spoonacular');
    });

    it('should fall back to LLM when Spoonacular not configured', async () => {
      isSpoonacularConfigured.mockReturnValue(false);
      isLLMConfigured.mockReturnValue(true);
      mockLLMService.suggestRecipes.mockResolvedValue(mockLLMRecipes);

      const result = await service.findRecipesForInventory(mockInventory);

      expect(mockLLMService.suggestRecipes).toHaveBeenCalled();
      expect(result).toEqual(mockLLMRecipes);
    });

    it('should prioritize expiring items', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const inventoryWithExpiring = [
        { name: 'Rice', location: 'pantry', expirationDate: null },
        { name: 'Chicken', location: 'fridge', expirationDate: tomorrow.toISOString() },
      ];

      isSpoonacularConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockResolvedValue([]);

      await service.findRecipesForInventory(inventoryWithExpiring, {
        prioritizeExpiring: true,
      });

      // Chicken should come first since it's expiring
      const ingredients = mockSpoonacular.findByIngredients.mock.calls[0][0];
      expect(ingredients[0]).toBe('Chicken');
    });

    it('should respect count option', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockResolvedValue([]);

      await service.findRecipesForInventory(mockInventory, { count: 10 });

      expect(mockSpoonacular.findByIngredients).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ number: 10 })
      );
    });

    it('should fall back to LLM on Spoonacular error', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      isLLMConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockRejectedValue(new Error('API error'));
      mockLLMService.suggestRecipes.mockResolvedValue(mockLLMRecipes);

      const result = await service.findRecipesForInventory(mockInventory);

      expect(mockLLMService.suggestRecipes).toHaveBeenCalled();
      expect(result).toEqual(mockLLMRecipes);
    });

    it('should throw when all providers fail', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      isLLMConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockRejectedValue(new Error('Spoonacular failed'));
      mockLLMService.suggestRecipes.mockRejectedValue(new Error('LLM failed'));

      await expect(service.findRecipesForInventory(mockInventory))
        .rejects.toThrow('Spoonacular failed');
    });

    it('should return empty array when no providers available', async () => {
      isSpoonacularConfigured.mockReturnValue(false);
      isLLMConfigured.mockReturnValue(false);

      const result = await service.findRecipesForInventory(mockInventory);
      expect(result).toEqual([]);
    });
  });

  describe('findRecipesForExpiring', () => {
    it('should return empty for no expiring items', async () => {
      const result = await service.findRecipesForExpiring([]);
      expect(result).toEqual([]);
    });

    it('should call findRecipesForInventory with prioritizeExpiring', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockResolvedValue([]);

      const expiringItems = [{ name: 'Milk' }];
      await service.findRecipesForExpiring(expiringItems);

      expect(mockSpoonacular.findByIngredients).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ ranking: 2 })
      );
    });

    it('should use default count of 3', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockResolvedValue([]);

      const expiringItems = [{ name: 'Milk' }];
      await service.findRecipesForExpiring(expiringItems);

      expect(mockSpoonacular.findByIngredients).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ number: 3 })
      );
    });
  });

  describe('getRecipeDetails', () => {
    it('should throw for LLM recipe IDs', async () => {
      await expect(service.getRecipeDetails('llm-12345'))
        .rejects.toThrow('Detailed view not available');
    });

    it('should throw when Spoonacular not configured', async () => {
      isSpoonacularConfigured.mockReturnValue(false);

      await expect(service.getRecipeDetails('12345'))
        .rejects.toThrow('Spoonacular not configured');
    });

    it('should fetch details from Spoonacular', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      const mockDetails = { id: 123, title: 'Recipe' };
      mockSpoonacular.getRecipeDetails.mockResolvedValue(mockDetails);

      const result = await service.getRecipeDetails('123');

      expect(mockSpoonacular.getRecipeDetails).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockDetails);
    });
  });

  describe('handleRecipeQuery', () => {
    it('should return message when no recipes found', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockResolvedValue([]);

      const result = await service.handleRecipeQuery('What can I make?', []);

      expect(result.recipes).toEqual([]);
      expect(result.response).toContain("couldn't find");
    });

    it('should return formatted response with recipes', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      mockSpoonacular.findByIngredients.mockResolvedValue([
        { id: 1, title: 'Recipe 1', readyInMinutes: 30 },
        { id: 2, title: 'Recipe 2', readyInMinutes: 45 },
      ]);

      const result = await service.handleRecipeQuery('What can I make?', [
        { name: 'Chicken' },
      ]);

      expect(result.recipes).toHaveLength(2);
      expect(result.response).toContain('Recipe 1');
      expect(result.response).toContain('30 min');
    });

    it('should note expiring items in response', async () => {
      isSpoonacularConfigured.mockReturnValue(true);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockSpoonacular.findByIngredients.mockResolvedValue([
        { id: 1, title: 'Recipe 1' },
      ]);

      const result = await service.handleRecipeQuery('What can I make?', [
        { name: 'Chicken', expirationDate: tomorrow.toISOString() },
      ]);

      expect(result.response).toContain('expiring');
    });
  });
});

describe('getRecipeService', () => {
  it('should return singleton instance', () => {
    const instance1 = getRecipeService();
    const instance2 = getRecipeService();
    expect(instance1).toBe(instance2);
  });
});

describe('isRecipeServiceAvailable', () => {
  it('should return true when Spoonacular configured', () => {
    isSpoonacularConfigured.mockReturnValue(true);
    isLLMConfigured.mockReturnValue(false);
    expect(isRecipeServiceAvailable()).toBe(true);
  });

  it('should return true when LLM configured', () => {
    isSpoonacularConfigured.mockReturnValue(false);
    isLLMConfigured.mockReturnValue(true);
    expect(isRecipeServiceAvailable()).toBe(true);
  });

  it('should return false when nothing configured', () => {
    isSpoonacularConfigured.mockReturnValue(false);
    isLLMConfigured.mockReturnValue(false);
    expect(isRecipeServiceAvailable()).toBe(false);
  });
});
