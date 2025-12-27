/**
 * Recipe Service
 *
 * Unified interface for recipe suggestions.
 * Uses Spoonacular API when available, falls back to LLM generation.
 */

const { getSpoonacularService, isSpoonacularConfigured } = require('./spoonacular');
const { getLLMRecipeService } = require('./llm-recipes');
const { isLLMConfigured } = require('../llm/provider-factory');
const { logger } = require('../logger');

/**
 * @typedef {Object} RecipeSuggestion
 * @property {string} id - Recipe ID (Spoonacular ID or LLM-generated)
 * @property {string} title - Recipe title
 * @property {string} [description] - Recipe description
 * @property {string} [image] - Recipe image URL
 * @property {number} [readyInMinutes] - Prep time
 * @property {number} [servings] - Servings
 * @property {string[]} usedIngredients - Ingredients from inventory used
 * @property {string[]} [missedIngredients] - Ingredients needed
 * @property {string[]} [instructions] - Step-by-step (LLM only)
 * @property {'spoonacular' | 'llm'} source - Recipe source
 */

class RecipeService {
  constructor() {
    this.spoonacular = getSpoonacularService();
    this.llmRecipes = getLLMRecipeService();
  }

  /**
   * Check if any recipe service is available
   * @returns {boolean}
   */
  isAvailable() {
    return isSpoonacularConfigured() || isLLMConfigured();
  }

  /**
   * Get the active provider name
   * @returns {string}
   */
  getProviderName() {
    if (isSpoonacularConfigured()) {
      return 'spoonacular';
    }
    if (isLLMConfigured()) {
      return 'llm';
    }
    return 'none';
  }

  /**
   * Find recipes based on available inventory
   * @param {Object[]} inventoryItems - Inventory items
   * @param {Object} [options]
   * @param {number} [options.count=5] - Number of recipes
   * @param {boolean} [options.prioritizeExpiring=true] - Prioritize expiring items
   * @param {string[]} [options.dietaryRestrictions] - Dietary restrictions
   * @returns {Promise<RecipeSuggestion[]>}
   */
  async findRecipesForInventory(inventoryItems, options = {}) {
    const { count = 5, prioritizeExpiring = true, dietaryRestrictions = [] } = options;

    if (!inventoryItems || inventoryItems.length === 0) {
      logger.debug('No inventory items provided for recipe search');
      return [];
    }

    // Extract ingredient names, prioritizing expiring items
    let ingredients = inventoryItems.map(item => item.name);

    if (prioritizeExpiring) {
      const now = new Date();
      const expiringItems = inventoryItems
        .filter(item => {
          if (!item.expirationDate) return false;
          const daysUntil = Math.ceil((new Date(item.expirationDate) - now) / (1000 * 60 * 60 * 24));
          return daysUntil <= 5;
        })
        .map(item => item.name);

      // Put expiring items first
      if (expiringItems.length > 0) {
        const nonExpiring = ingredients.filter(name => !expiringItems.includes(name));
        ingredients = [...expiringItems, ...nonExpiring];
      }
    }

    logger.info({ ingredientCount: ingredients.length, provider: this.getProviderName() }, 'Finding recipes');

    try {
      // Try Spoonacular first
      if (isSpoonacularConfigured()) {
        const recipes = await this.spoonacular.findByIngredients(ingredients, {
          number: count,
          ranking: 2, // Minimize missing ingredients
        });

        return recipes.map(r => ({
          ...r,
          source: 'spoonacular',
        }));
      }

      // Fall back to LLM
      if (isLLMConfigured()) {
        const recipes = await this.llmRecipes.suggestRecipes(inventoryItems, {
          count,
          dietaryRestrictions,
        });

        return recipes;
      }

      logger.warn('No recipe provider available');
      return [];
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to find recipes');

      // Try fallback if primary fails
      if (isSpoonacularConfigured() && isLLMConfigured()) {
        logger.info('Falling back to LLM recipes');
        try {
          return await this.llmRecipes.suggestRecipes(inventoryItems, {
            count,
            dietaryRestrictions,
          });
        } catch (fallbackError) {
          logger.error({ error: fallbackError.message }, 'Fallback also failed');
        }
      }

      throw error;
    }
  }

  /**
   * Find recipes for items expiring soon
   * @param {Object[]} expiringItems - Items expiring within N days
   * @param {Object} [options]
   * @returns {Promise<RecipeSuggestion[]>}
   */
  async findRecipesForExpiring(expiringItems, options = {}) {
    if (!expiringItems || expiringItems.length === 0) {
      return [];
    }

    logger.info({ count: expiringItems.length }, 'Finding recipes for expiring items');

    return this.findRecipesForInventory(expiringItems, {
      ...options,
      prioritizeExpiring: true,
      count: options.count || 3,
    });
  }

  /**
   * Get detailed recipe information
   * @param {string} recipeId - Recipe ID
   * @returns {Promise<Object>}
   */
  async getRecipeDetails(recipeId) {
    // Only works for Spoonacular recipes
    if (recipeId.startsWith('llm-')) {
      throw new Error('Detailed view not available for LLM-generated recipes');
    }

    if (!isSpoonacularConfigured()) {
      throw new Error('Spoonacular not configured');
    }

    return this.spoonacular.getRecipeDetails(parseInt(recipeId, 10));
  }

  /**
   * Quick recipe suggestion for natural language queries
   * @param {string} query - Natural language query like "What can I make with chicken?"
   * @param {Object[]} inventoryItems - Current inventory
   * @returns {Promise<{response: string, recipes: RecipeSuggestion[]}>}
   */
  async handleRecipeQuery(query, inventoryItems) {
    const recipes = await this.findRecipesForInventory(inventoryItems, { count: 3 });

    if (recipes.length === 0) {
      return {
        response: "I couldn't find any recipe suggestions based on your current inventory. Try adding more items!",
        recipes: [],
      };
    }

    // Build a friendly response
    const recipeList = recipes
      .map((r, i) => `${i + 1}. **${r.title}**${r.readyInMinutes ? ` (${r.readyInMinutes} min)` : ''}`)
      .join('\n');

    const expiringNote = inventoryItems.some(item => {
      if (!item.expirationDate) return false;
      const daysUntil = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3;
    })
      ? "\n\nThese recipes prioritize your expiring items!"
      : '';

    return {
      response: `Here are some recipes you can make:\n\n${recipeList}${expiringNote}`,
      recipes,
    };
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get the recipe service instance
 * @returns {RecipeService}
 */
function getRecipeService() {
  if (!serviceInstance) {
    serviceInstance = new RecipeService();
  }
  return serviceInstance;
}

/**
 * Check if recipe service is available
 * @returns {boolean}
 */
function isRecipeServiceAvailable() {
  return isSpoonacularConfigured() || isLLMConfigured();
}

module.exports = {
  RecipeService,
  getRecipeService,
  isRecipeServiceAvailable,
  // Re-export individual services
  getSpoonacularService,
  isSpoonacularConfigured,
  getLLMRecipeService,
};
