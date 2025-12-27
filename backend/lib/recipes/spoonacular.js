/**
 * Spoonacular Recipe API Service
 *
 * Provides recipe suggestions based on available ingredients.
 * Uses the Spoonacular API as the primary source, with LLM fallback.
 *
 * @see https://spoonacular.com/food-api/docs
 */

const { logger } = require('../logger');

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

/**
 * @typedef {Object} Recipe
 * @property {number} id - Spoonacular recipe ID
 * @property {string} title - Recipe title
 * @property {string} image - Recipe image URL
 * @property {number} usedIngredientCount - Number of ingredients from user's inventory used
 * @property {number} missedIngredientCount - Number of ingredients user doesn't have
 * @property {string[]} usedIngredients - Ingredients from inventory that are used
 * @property {string[]} missedIngredients - Ingredients user needs to get
 * @property {number} [readyInMinutes] - Preparation time
 * @property {number} [servings] - Number of servings
 * @property {string} [sourceUrl] - Original recipe URL
 * @property {string} [summary] - Recipe summary (HTML)
 */

/**
 * @typedef {Object} RecipeDetails
 * @property {number} id
 * @property {string} title
 * @property {string} image
 * @property {number} readyInMinutes
 * @property {number} servings
 * @property {string} sourceUrl
 * @property {string} summary
 * @property {string[]} cuisines
 * @property {string[]} dishTypes
 * @property {string[]} diets
 * @property {Object[]} extendedIngredients
 * @property {string} instructions
 * @property {Object[]} analyzedInstructions
 */

class SpoonacularService {
  /**
   * @param {Object} options
   * @param {string} [options.apiKey] - Spoonacular API key
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.SPOONACULAR_API_KEY;
    this.baseUrl = SPOONACULAR_BASE_URL;

    if (!this.apiKey) {
      logger.warn('SPOONACULAR_API_KEY not set - recipe suggestions will be limited');
    }
  }

  /**
   * Check if the service is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Make an API request to Spoonacular
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>}
   */
  async request(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('Spoonacular API key not configured');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('apiKey', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      logger.error({ error: error.message, endpoint }, 'Spoonacular API request failed');
      throw error;
    }
  }

  /**
   * Find recipes by available ingredients
   * @param {string[]} ingredients - List of ingredient names
   * @param {Object} [options]
   * @param {number} [options.number=5] - Number of recipes to return
   * @param {number} [options.ranking=2] - 1=maximize used, 2=minimize missing
   * @param {boolean} [options.ignorePantry=true] - Ignore common pantry items
   * @returns {Promise<Recipe[]>}
   */
  async findByIngredients(ingredients, options = {}) {
    const { number = 5, ranking = 2, ignorePantry = true } = options;

    if (!ingredients || ingredients.length === 0) {
      return [];
    }

    logger.debug({ ingredientCount: ingredients.length }, 'Finding recipes by ingredients');

    const data = await this.request('/recipes/findByIngredients', {
      ingredients: ingredients.join(','),
      number,
      ranking,
      ignorePantry,
    });

    return data.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      usedIngredientCount: recipe.usedIngredientCount,
      missedIngredientCount: recipe.missedIngredientCount,
      usedIngredients: recipe.usedIngredients?.map(i => i.name) || [],
      missedIngredients: recipe.missedIngredients?.map(i => i.name) || [],
      likes: recipe.likes,
    }));
  }

  /**
   * Get detailed recipe information
   * @param {number} recipeId - Spoonacular recipe ID
   * @param {Object} [options]
   * @param {boolean} [options.includeNutrition=false] - Include nutrition data
   * @returns {Promise<RecipeDetails>}
   */
  async getRecipeDetails(recipeId, options = {}) {
    const { includeNutrition = false } = options;

    const data = await this.request(`/recipes/${recipeId}/information`, {
      includeNutrition,
    });

    return {
      id: data.id,
      title: data.title,
      image: data.image,
      readyInMinutes: data.readyInMinutes,
      servings: data.servings,
      sourceUrl: data.sourceUrl,
      summary: this.stripHtml(data.summary),
      cuisines: data.cuisines || [],
      dishTypes: data.dishTypes || [],
      diets: data.diets || [],
      extendedIngredients: data.extendedIngredients?.map(i => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        original: i.original,
      })) || [],
      instructions: this.stripHtml(data.instructions),
      analyzedInstructions: data.analyzedInstructions || [],
    };
  }

  /**
   * Search for recipes with filters
   * @param {Object} options
   * @param {string} [options.query] - Search query
   * @param {string} [options.cuisine] - Cuisine type
   * @param {string} [options.diet] - Diet type (vegetarian, vegan, etc.)
   * @param {string[]} [options.intolerances] - Intolerances to exclude
   * @param {number} [options.maxReadyTime] - Max preparation time in minutes
   * @param {number} [options.number=5] - Number of results
   * @returns {Promise<Recipe[]>}
   */
  async searchRecipes(options = {}) {
    const {
      query,
      cuisine,
      diet,
      intolerances,
      maxReadyTime,
      number = 5,
    } = options;

    const data = await this.request('/recipes/complexSearch', {
      query,
      cuisine,
      diet,
      intolerances: intolerances?.join(','),
      maxReadyTime,
      number,
      addRecipeInformation: true,
    });

    return data.results?.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      cuisines: recipe.cuisines || [],
      dishTypes: recipe.dishTypes || [],
      diets: recipe.diets || [],
    })) || [];
  }

  /**
   * Get random recipes
   * @param {Object} [options]
   * @param {number} [options.number=3] - Number of recipes
   * @param {string[]} [options.tags] - Filter tags
   * @returns {Promise<Recipe[]>}
   */
  async getRandomRecipes(options = {}) {
    const { number = 3, tags } = options;

    const data = await this.request('/recipes/random', {
      number,
      tags: tags?.join(','),
    });

    return data.recipes?.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      sourceUrl: recipe.sourceUrl,
    })) || [];
  }

  /**
   * Strip HTML tags from text
   * @param {string} html
   * @returns {string}
   */
  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get the Spoonacular service instance
 * @returns {SpoonacularService}
 */
function getSpoonacularService() {
  if (!serviceInstance) {
    serviceInstance = new SpoonacularService();
  }
  return serviceInstance;
}

/**
 * Check if Spoonacular is configured
 * @returns {boolean}
 */
function isSpoonacularConfigured() {
  return !!process.env.SPOONACULAR_API_KEY;
}

module.exports = {
  SpoonacularService,
  getSpoonacularService,
  isSpoonacularConfigured,
};
