/**
 * LLM-based Recipe Service
 *
 * Fallback recipe suggestions using the configured LLM provider.
 * Used when Spoonacular API is not configured.
 */

const { getProvider, isLLMConfigured } = require('../llm/provider-factory');
const { logger } = require('../logger');

/**
 * @typedef {Object} LLMRecipe
 * @property {string} id - Generated recipe ID
 * @property {string} title - Recipe title
 * @property {string} description - Brief description
 * @property {number} readyInMinutes - Estimated prep time
 * @property {number} servings - Number of servings
 * @property {string[]} usedIngredients - Ingredients from user's inventory
 * @property {string[]} additionalIngredients - Common pantry items that might be needed
 * @property {string[]} instructions - Step-by-step instructions
 * @property {string} difficulty - easy, medium, hard
 */

const RECIPE_GENERATION_TOOLS = [
  {
    name: 'suggest_recipes',
    description: 'Generate recipe suggestions based on available ingredients',
    parameters: {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          description: 'List of recipe suggestions',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Recipe name',
              },
              description: {
                type: 'string',
                description: 'Brief appetizing description (1-2 sentences)',
              },
              readyInMinutes: {
                type: 'number',
                description: 'Estimated total preparation and cooking time',
              },
              servings: {
                type: 'number',
                description: 'Number of servings',
              },
              usedIngredients: {
                type: 'array',
                items: { type: 'string' },
                description: 'Ingredients from the available list that will be used',
              },
              additionalIngredients: {
                type: 'array',
                items: { type: 'string' },
                description: 'Common pantry staples that might be needed (salt, oil, etc.)',
              },
              instructions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step-by-step cooking instructions',
              },
              difficulty: {
                type: 'string',
                enum: ['easy', 'medium', 'hard'],
                description: 'Recipe difficulty level',
              },
            },
            required: ['title', 'description', 'readyInMinutes', 'usedIngredients', 'instructions'],
          },
        },
      },
      required: ['recipes'],
    },
  },
];

const SYSTEM_PROMPT = `You are a helpful culinary assistant. Your job is to suggest practical, delicious recipes based on the ingredients the user has available.

Guidelines:
1. Prioritize using ingredients that are expiring soon
2. Suggest realistic, achievable recipes for home cooks
3. Include a variety of meal types (breakfast, lunch, dinner, snacks) when possible
4. Consider common pantry staples (salt, pepper, oil, butter) as available
5. Provide clear, concise instructions
6. Be creative but practical - avoid overly complex techniques
7. If ingredients are limited, suggest simple preparations

Always use the suggest_recipes tool to structure your response.`;

class LLMRecipeService {
  constructor() {
    this.provider = null;
  }

  /**
   * Get or initialize the LLM provider
   * @returns {Object}
   */
  _getProvider() {
    if (!this.provider) {
      if (!isLLMConfigured()) {
        throw new Error('No LLM provider configured');
      }
      this.provider = getProvider();
    }
    return this.provider;
  }

  /**
   * Check if service is available
   * @returns {boolean}
   */
  isAvailable() {
    return isLLMConfigured();
  }

  /**
   * Generate recipe suggestions from available ingredients
   * @param {Object[]} ingredients - Inventory items
   * @param {Object} [options]
   * @param {number} [options.count=3] - Number of recipes to generate
   * @param {string[]} [options.dietaryRestrictions] - Dietary restrictions
   * @param {string} [options.mealType] - Preferred meal type
   * @returns {Promise<LLMRecipe[]>}
   */
  async suggestRecipes(ingredients, options = {}) {
    const { count = 3, dietaryRestrictions = [], mealType } = options;

    const provider = this._getProvider();

    // Build ingredient context
    const expiringItems = ingredients
      .filter(i => i.expirationDate && this._daysUntilExpiration(i.expirationDate) <= 3)
      .map(i => `${i.name} (expiring soon!)`);

    const regularItems = ingredients
      .filter(i => !i.expirationDate || this._daysUntilExpiration(i.expirationDate) > 3)
      .map(i => i.name);

    const ingredientList = [...expiringItems, ...regularItems];

    let userPrompt = `I have these ingredients available:\n${ingredientList.join(', ')}`;

    if (expiringItems.length > 0) {
      userPrompt += `\n\nPlease prioritize using the expiring items!`;
    }

    if (dietaryRestrictions.length > 0) {
      userPrompt += `\n\nDietary restrictions: ${dietaryRestrictions.join(', ')}`;
    }

    if (mealType) {
      userPrompt += `\n\nI'm looking for ${mealType} ideas.`;
    }

    userPrompt += `\n\nPlease suggest ${count} recipes I could make.`;

    logger.debug({ ingredientCount: ingredients.length, count }, 'Generating LLM recipes');

    try {
      const response = await provider.chat(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.7, // More creative for recipes
          tools: RECIPE_GENERATION_TOOLS,
          toolChoice: { type: 'tool', name: 'suggest_recipes' },
        }
      );

      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolCall = response.toolCalls[0];
        const recipes = toolCall.arguments.recipes || [];

        return recipes.map((recipe, index) => ({
          id: `llm-${Date.now()}-${index}`,
          title: recipe.title,
          description: recipe.description,
          readyInMinutes: recipe.readyInMinutes || 30,
          servings: recipe.servings || 4,
          usedIngredients: recipe.usedIngredients || [],
          additionalIngredients: recipe.additionalIngredients || [],
          instructions: recipe.instructions || [],
          difficulty: recipe.difficulty || 'medium',
          source: 'llm',
        }));
      }

      logger.warn('LLM did not return structured recipes');
      return [];
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to generate LLM recipes');
      throw error;
    }
  }

  /**
   * Get a single detailed recipe for specific ingredients
   * @param {string[]} ingredientNames - Specific ingredients to use
   * @param {Object} [options]
   * @returns {Promise<LLMRecipe>}
   */
  async getDetailedRecipe(ingredientNames, options = {}) {
    const recipes = await this.suggestRecipes(
      ingredientNames.map(name => ({ name })),
      { ...options, count: 1 }
    );
    return recipes[0] || null;
  }

  /**
   * Calculate days until expiration
   * @param {Date|string} expirationDate
   * @returns {number}
   */
  _daysUntilExpiration(expirationDate) {
    const expDate = new Date(expirationDate);
    const now = new Date();
    return Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get the LLM recipe service instance
 * @returns {LLMRecipeService}
 */
function getLLMRecipeService() {
  if (!serviceInstance) {
    serviceInstance = new LLMRecipeService();
  }
  return serviceInstance;
}

module.exports = {
  LLMRecipeService,
  getLLMRecipeService,
};
