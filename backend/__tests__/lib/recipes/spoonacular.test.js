/**
 * Tests for Spoonacular Recipe Service
 */

const { SpoonacularService, getSpoonacularService, isSpoonacularConfigured } = require('../../../lib/recipes/spoonacular');

// Mock fetch globally
global.fetch = jest.fn();

describe('SpoonacularService', () => {
  let service;
  const mockApiKey = 'test-api-key-123';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SPOONACULAR_API_KEY = mockApiKey;
    service = new SpoonacularService({ apiKey: mockApiKey });
  });

  afterEach(() => {
    delete process.env.SPOONACULAR_API_KEY;
  });

  describe('constructor', () => {
    it('should use provided API key', () => {
      const s = new SpoonacularService({ apiKey: 'custom-key' });
      expect(s.apiKey).toBe('custom-key');
    });

    it('should fall back to environment variable', () => {
      process.env.SPOONACULAR_API_KEY = 'env-key';
      const s = new SpoonacularService();
      expect(s.apiKey).toBe('env-key');
    });

    it('should handle missing API key gracefully', () => {
      delete process.env.SPOONACULAR_API_KEY;
      const s = new SpoonacularService();
      expect(s.apiKey).toBeUndefined();
    });
  });

  describe('isConfigured', () => {
    it('should return true when API key is set', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.SPOONACULAR_API_KEY;
      const s = new SpoonacularService({});
      expect(s.isConfigured()).toBe(false);
    });
  });

  describe('request', () => {
    it('should make API request with correct URL', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'success' }),
      });

      await service.request('/recipes/test', { param1: 'value1' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.spoonacular.com/recipes/test')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`apiKey=${mockApiKey}`)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('param1=value1')
      );
    });

    it('should throw error when API key is not configured', async () => {
      delete process.env.SPOONACULAR_API_KEY;
      const s = new SpoonacularService({});
      await expect(s.request('/test')).rejects.toThrow('Spoonacular API key not configured');
    });

    it('should throw error on API failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Rate limit exceeded' }),
      });

      await expect(service.request('/test')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.request('/test')).rejects.toThrow('Network error');
    });
  });

  describe('findByIngredients', () => {
    const mockRecipes = [
      {
        id: 1,
        title: 'Pasta with Tomatoes',
        image: 'https://example.com/pasta.jpg',
        usedIngredientCount: 2,
        missedIngredientCount: 1,
        usedIngredients: [{ name: 'pasta' }, { name: 'tomatoes' }],
        missedIngredients: [{ name: 'basil' }],
        likes: 100,
      },
      {
        id: 2,
        title: 'Tomato Soup',
        image: 'https://example.com/soup.jpg',
        usedIngredientCount: 1,
        missedIngredientCount: 2,
        usedIngredients: [{ name: 'tomatoes' }],
        missedIngredients: [{ name: 'cream' }, { name: 'onion' }],
        likes: 50,
      },
    ];

    it('should return empty array for no ingredients', async () => {
      const result = await service.findByIngredients([]);
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call API with correct parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes,
      });

      await service.findByIngredients(['pasta', 'tomatoes'], { number: 3 });

      // URL-encoded comma: %2C
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('ingredients=pasta%2Ctomatoes')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('number=3')
      );
    });

    it('should transform response correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes,
      });

      const result = await service.findByIngredients(['pasta', 'tomatoes']);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Pasta with Tomatoes',
        image: 'https://example.com/pasta.jpg',
        usedIngredientCount: 2,
        missedIngredientCount: 1,
        usedIngredients: ['pasta', 'tomatoes'],
        missedIngredients: ['basil'],
        likes: 100,
      });
    });

    it('should use default options', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecipes,
      });

      await service.findByIngredients(['pasta']);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('number=5')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('ranking=2')
      );
    });
  });

  describe('getRecipeDetails', () => {
    const mockDetails = {
      id: 123,
      title: 'Amazing Pasta',
      image: 'https://example.com/pasta.jpg',
      readyInMinutes: 30,
      servings: 4,
      sourceUrl: 'https://example.com/recipe',
      summary: '<b>Amazing</b> pasta recipe.',
      cuisines: ['Italian'],
      dishTypes: ['main course'],
      diets: ['vegetarian'],
      extendedIngredients: [
        { name: 'pasta', amount: 200, unit: 'g', original: '200g pasta' },
      ],
      instructions: '<p>Cook the pasta.</p>',
      analyzedInstructions: [],
    };

    it('should fetch recipe details', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetails,
      });

      const result = await service.getRecipeDetails(123);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/123/information')
      );
      expect(result.id).toBe(123);
      expect(result.title).toBe('Amazing Pasta');
    });

    it('should strip HTML from summary and instructions', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetails,
      });

      const result = await service.getRecipeDetails(123);

      expect(result.summary).toBe('Amazing pasta recipe.');
      expect(result.instructions).toBe('Cook the pasta.');
    });

    it('should transform ingredients correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetails,
      });

      const result = await service.getRecipeDetails(123);

      expect(result.extendedIngredients).toHaveLength(1);
      expect(result.extendedIngredients[0]).toEqual({
        name: 'pasta',
        amount: 200,
        unit: 'g',
        original: '200g pasta',
      });
    });
  });

  describe('searchRecipes', () => {
    const mockSearchResults = {
      results: [
        {
          id: 1,
          title: 'Vegetarian Curry',
          image: 'https://example.com/curry.jpg',
          readyInMinutes: 45,
          servings: 4,
          cuisines: ['Indian'],
          dishTypes: ['main course'],
          diets: ['vegetarian'],
        },
      ],
    };

    it('should search recipes with filters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults,
      });

      await service.searchRecipes({
        query: 'curry',
        cuisine: 'Indian',
        diet: 'vegetarian',
        maxReadyTime: 60,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=curry')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('cuisine=Indian')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('diet=vegetarian')
      );
    });

    it('should transform search results', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults,
      });

      const result = await service.searchRecipes({ query: 'curry' });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Vegetarian Curry');
      expect(result[0].diets).toContain('vegetarian');
    });
  });

  describe('getRandomRecipes', () => {
    const mockRandomRecipes = {
      recipes: [
        { id: 1, title: 'Random Recipe 1', readyInMinutes: 20, servings: 2 },
        { id: 2, title: 'Random Recipe 2', readyInMinutes: 30, servings: 4 },
      ],
    };

    it('should fetch random recipes', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRandomRecipes,
      });

      const result = await service.getRandomRecipes({ number: 2 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recipes/random')
      );
      expect(result).toHaveLength(2);
    });

    it('should use default count of 3', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRandomRecipes,
      });

      await service.getRandomRecipes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('number=3')
      );
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(service.stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('should decode HTML entities', () => {
      expect(service.stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
      expect(service.stripHtml('&lt;script&gt;')).toBe('<script>');
      expect(service.stripHtml('&quot;quoted&quot;')).toBe('"quoted"');
    });

    it('should handle empty input', () => {
      expect(service.stripHtml('')).toBe('');
      expect(service.stripHtml(null)).toBe('');
      expect(service.stripHtml(undefined)).toBe('');
    });
  });
});

describe('getSpoonacularService', () => {
  it('should return singleton instance', () => {
    const instance1 = getSpoonacularService();
    const instance2 = getSpoonacularService();
    expect(instance1).toBe(instance2);
  });
});

describe('isSpoonacularConfigured', () => {
  afterEach(() => {
    delete process.env.SPOONACULAR_API_KEY;
  });

  it('should return true when API key is set', () => {
    process.env.SPOONACULAR_API_KEY = 'test-key';
    expect(isSpoonacularConfigured()).toBe(true);
  });

  it('should return false when API key is not set', () => {
    delete process.env.SPOONACULAR_API_KEY;
    expect(isSpoonacularConfigured()).toBe(false);
  });
});
