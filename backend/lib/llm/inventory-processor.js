/**
 * Inventory Intent Processor
 *
 * Uses LLM to parse natural language into inventory actions.
 *
 * Examples:
 *   "I bought milk and eggs" → add_items
 *   "Used the chicken for dinner" → consume_items
 *   "The lettuce went bad" → waste_items
 *   "What's expiring soon?" → query_inventory
 *   "What can I make for dinner?" → suggest_recipes
 */

const { getProvider, isLLMConfigured } = require('./provider-factory');
const { logger } = require('../logger');

/**
 * @typedef {Object} ParsedItem
 * @property {string} name - Item name
 * @property {number} [quantity=1] - Quantity
 * @property {string} [unit='item'] - Unit of measurement
 * @property {'fridge' | 'freezer' | 'pantry'} [location] - Storage location
 * @property {number} [expirationDays] - Days until expiration
 * @property {string} [category] - Item category
 */

/**
 * @typedef {Object} InventoryIntent
 * @property {'add' | 'consume' | 'waste' | 'query' | 'recipe' | 'unknown'} action
 * @property {ParsedItem[]} items - Parsed items
 * @property {string} [response] - Natural language response for queries
 * @property {Object} [recipeRequest] - Recipe request details (for recipe action)
 * @property {number} confidence - Confidence score 0-1
 */

/**
 * @typedef {Object} HouseholdContext
 * @property {string} householdId - Household ID
 * @property {string} [inventorySummary] - Compressed inventory summary
 * @property {string[]} [recentItems] - Recently added/consumed items
 * @property {Object} [preferences] - User preferences
 */

// Tool definitions for structured output
const INVENTORY_TOOLS = [
  {
    name: 'add_items',
    description: 'Add new items to the household inventory. Use when user mentions buying, getting, or adding food items.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'List of items to add',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Item name (e.g., "Whole Milk", "Organic Eggs")',
              },
              quantity: {
                type: 'number',
                description: 'Quantity (default 1)',
              },
              unit: {
                type: 'string',
                description: 'Unit of measurement (e.g., "gal", "dozen", "lb", "oz", "item")',
              },
              location: {
                type: 'string',
                enum: ['fridge', 'freezer', 'pantry'],
                description: 'Where to store the item',
              },
              expirationDays: {
                type: 'number',
                description: 'Days until expiration (infer from item type if not specified)',
              },
              category: {
                type: 'string',
                description: 'Category (Dairy, Produce, Meat, Grains, etc.)',
              },
            },
            required: ['name'],
          },
        },
        response: {
          type: 'string',
          description: 'Friendly confirmation message to show the user',
        },
      },
      required: ['items', 'response'],
    },
  },
  {
    name: 'consume_items',
    description: 'Mark items as consumed/used. Use when user mentions eating, using, cooking with, or finishing items.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'List of items that were consumed',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Item name to match in inventory',
              },
              quantity: {
                type: 'number',
                description: 'Quantity consumed (omit for "all")',
              },
              unit: {
                type: 'string',
                description: 'Unit of measurement',
              },
            },
            required: ['name'],
          },
        },
        response: {
          type: 'string',
          description: 'Friendly confirmation message',
        },
      },
      required: ['items', 'response'],
    },
  },
  {
    name: 'waste_items',
    description: 'Mark items as wasted/expired/thrown out. Use when user mentions throwing away, expired, spoiled, or gone bad.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'List of items that were wasted',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Item name to match in inventory',
              },
              quantity: {
                type: 'number',
                description: 'Quantity wasted (omit for "all")',
              },
              reason: {
                type: 'string',
                description: 'Why it was wasted (expired, spoiled, etc.)',
              },
            },
            required: ['name'],
          },
        },
        response: {
          type: 'string',
          description: 'Friendly message (sympathetic but encouraging)',
        },
      },
      required: ['items', 'response'],
    },
  },
  {
    name: 'query_inventory',
    description: 'Answer questions about current inventory. Use for questions like "what do I have", "what\'s expiring", "do I have milk".',
    parameters: {
      type: 'object',
      properties: {
        queryType: {
          type: 'string',
          enum: ['expiring_soon', 'all_items', 'specific_item', 'by_location', 'by_category'],
          description: 'Type of query',
        },
        filter: {
          type: 'string',
          description: 'Optional filter (item name, location, or category)',
        },
        response: {
          type: 'string',
          description: 'Natural language answer to the query',
        },
      },
      required: ['queryType', 'response'],
    },
  },
  {
    name: 'suggest_recipes',
    description: 'Suggest recipes based on available ingredients. Use when user asks "what can I make", "recipe ideas", "what should I cook", "dinner ideas", or similar cooking-related questions.',
    parameters: {
      type: 'object',
      properties: {
        mealType: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'any'],
          description: 'Type of meal the user is looking for',
        },
        prioritizeExpiring: {
          type: 'boolean',
          description: 'Whether to prioritize items expiring soon (default true)',
        },
        specificIngredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific ingredients user wants to use (if mentioned)',
        },
        dietaryRestrictions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Any dietary restrictions mentioned (vegetarian, vegan, gluten-free, etc.)',
        },
        response: {
          type: 'string',
          description: 'Friendly acknowledgment that you will find recipes for them',
        },
      },
      required: ['mealType', 'response'],
    },
  },
];

// System prompt template
const SYSTEM_PROMPT_TEMPLATE = `You are Pantrybot, a friendly kitchen inventory assistant.

Your job is to understand what the user is saying about their groceries and food, then use the appropriate tool to help them manage their inventory.

CURRENT INVENTORY CONTEXT:
{{inventorySummary}}

GUIDELINES:
1. For ADD actions: Infer reasonable storage locations and expiration times based on item type
   - Dairy, meat, produce → fridge (7-14 days)
   - Frozen items → freezer (30-90 days)
   - Canned goods, dry goods, snacks → pantry (60-365 days)

2. For CONSUME actions: Match item names flexibly (e.g., "milk" matches "Whole Milk")

3. For WASTE actions: Be sympathetic but encouraging about reducing waste

4. For QUERIES: Provide helpful, concise answers based on the inventory context

5. For RECIPES: When users ask "what can I make", "recipe ideas", "what should I cook", or similar:
   - Use the suggest_recipes tool
   - Extract meal type if mentioned (breakfast, lunch, dinner, etc.)
   - Note any specific ingredients they want to use
   - Note any dietary restrictions
   - Prioritize expiring items unless they specify otherwise

6. Always respond in a friendly, helpful tone

7. If the message isn't about food/groceries, respond conversationally without using tools`;

class InventoryIntentProcessor {
  /**
   * @param {Object} [options]
   * @param {import('./types').BaseLLMProvider} [options.provider] - LLM provider to use
   */
  constructor(options = {}) {
    this.provider = options.provider;
  }

  /**
   * Get the LLM provider (lazy initialization)
   * @returns {import('./types').BaseLLMProvider}
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
   * Process a user message and extract inventory intent
   * @param {string} userMessage - The user's natural language message
   * @param {HouseholdContext} context - Household context
   * @returns {Promise<InventoryIntent>}
   */
  async process(userMessage, context = {}) {
    const provider = this._getProvider();

    // Build system prompt with context
    const systemPrompt = this._buildSystemPrompt(context);

    logger.debug({ userMessage, householdId: context.householdId }, 'Processing inventory message');

    try {
      const response = await provider.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        {
          temperature: 0.2, // Low temperature for consistent parsing
          tools: INVENTORY_TOOLS,
          toolChoice: 'auto',
        }
      );

      // Parse the response
      const intent = this._parseResponse(response);

      logger.info(
        {
          action: intent.action,
          itemCount: intent.items?.length || 0,
          confidence: intent.confidence,
        },
        'Processed inventory intent'
      );

      return intent;
    } catch (error) {
      logger.error({ error: error.message, userMessage }, 'Failed to process inventory message');

      return {
        action: 'unknown',
        items: [],
        response: "I'm having trouble understanding that. Could you try rephrasing?",
        confidence: 0,
      };
    }
  }

  /**
   * Build system prompt with household context
   * @param {HouseholdContext} context
   * @returns {string}
   */
  _buildSystemPrompt(context) {
    let inventorySummary = 'No inventory data available.';

    if (context.inventorySummary) {
      inventorySummary = context.inventorySummary;
    }

    if (context.recentItems && context.recentItems.length > 0) {
      inventorySummary += `\n\nRecently active items: ${context.recentItems.join(', ')}`;
    }

    return SYSTEM_PROMPT_TEMPLATE.replace('{{inventorySummary}}', inventorySummary);
  }

  /**
   * Parse LLM response into InventoryIntent
   * @param {import('./types').ChatResponse} response
   * @returns {InventoryIntent}
   */
  _parseResponse(response) {
    // Check for tool calls first
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolCall = response.toolCalls[0];
      const args = toolCall.arguments;

      switch (toolCall.name) {
        case 'add_items':
          return {
            action: 'add',
            items: this._normalizeItems(args.items || []),
            response: args.response,
            confidence: 0.9,
          };

        case 'consume_items':
          return {
            action: 'consume',
            items: this._normalizeItems(args.items || []),
            response: args.response,
            confidence: 0.9,
          };

        case 'waste_items':
          return {
            action: 'waste',
            items: this._normalizeItems(args.items || [], true),
            response: args.response,
            confidence: 0.9,
          };

        case 'query_inventory':
          return {
            action: 'query',
            items: [],
            queryType: args.queryType,
            filter: args.filter,
            response: args.response,
            confidence: 0.85,
          };

        case 'suggest_recipes':
          return {
            action: 'recipe',
            items: [],
            recipeRequest: {
              mealType: args.mealType || 'any',
              prioritizeExpiring: args.prioritizeExpiring !== false,
              specificIngredients: args.specificIngredients || [],
              dietaryRestrictions: args.dietaryRestrictions || [],
            },
            response: args.response,
            confidence: 0.9,
          };

        default:
          logger.warn({ toolName: toolCall.name }, 'Unknown tool called');
      }
    }

    // No tool call - just a conversational response
    return {
      action: 'unknown',
      items: [],
      response: response.content || "I'm not sure what you mean. Could you tell me more?",
      confidence: 0.5,
    };
  }

  /**
   * Normalize parsed items with defaults
   * @param {Object[]} items
   * @param {boolean} [isWaste=false]
   * @returns {ParsedItem[]}
   */
  _normalizeItems(items, isWaste = false) {
    return items.map(item => ({
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'item',
      location: item.location || this._inferLocation(item.name),
      expirationDays: item.expirationDays || this._inferExpiration(item.name, item.location),
      category: item.category || this._inferCategory(item.name),
      ...(isWaste && item.reason ? { reason: item.reason } : {}),
    }));
  }

  /**
   * Infer storage location from item name
   * @param {string} itemName
   * @returns {'fridge' | 'freezer' | 'pantry'}
   */
  _inferLocation(itemName) {
    const name = itemName.toLowerCase();

    // Freezer items
    const freezerKeywords = ['frozen', 'ice cream', 'popsicle', 'freezer'];
    if (freezerKeywords.some(kw => name.includes(kw))) {
      return 'freezer';
    }

    // Pantry items
    const pantryKeywords = [
      'canned', 'can of', 'rice', 'pasta', 'cereal', 'chips', 'crackers',
      'cookies', 'bread', 'flour', 'sugar', 'oil', 'vinegar', 'spice',
      'seasoning', 'sauce', 'ketchup', 'mustard', 'peanut butter',
    ];
    if (pantryKeywords.some(kw => name.includes(kw))) {
      return 'pantry';
    }

    // Default to fridge for fresh items
    return 'fridge';
  }

  /**
   * Infer expiration days from item type
   * @param {string} itemName
   * @param {string} [location]
   * @returns {number}
   */
  _inferExpiration(itemName, location) {
    const name = itemName.toLowerCase();

    // Very short (1-3 days)
    if (['lettuce', 'spinach', 'berries', 'strawberries', 'raspberries'].some(kw => name.includes(kw))) {
      return 3;
    }

    // Short (5-7 days)
    if (['milk', 'cream', 'yogurt', 'deli', 'leftover'].some(kw => name.includes(kw))) {
      return 7;
    }

    // Medium (2-3 weeks)
    if (['cheese', 'eggs', 'butter', 'juice', 'hummus'].some(kw => name.includes(kw))) {
      return 14;
    }

    // Long (1+ month)
    if (location === 'freezer') {
      return 90;
    }

    if (location === 'pantry') {
      return 180;
    }

    // Default for fridge items
    return 7;
  }

  /**
   * Infer category from item name
   * @param {string} itemName
   * @returns {string}
   */
  _inferCategory(itemName) {
    const name = itemName.toLowerCase();

    const categories = {
      Dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'],
      Produce: ['lettuce', 'tomato', 'onion', 'pepper', 'carrot', 'broccoli', 'spinach', 'apple', 'banana', 'orange', 'berry', 'fruit', 'vegetable'],
      Meat: ['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'steak', 'ground', 'bacon', 'sausage'],
      Grains: ['bread', 'rice', 'pasta', 'cereal', 'oat', 'flour', 'tortilla'],
      Beverages: ['juice', 'soda', 'water', 'coffee', 'tea', 'wine', 'beer'],
      Condiments: ['ketchup', 'mustard', 'mayo', 'sauce', 'dressing', 'oil', 'vinegar'],
      Snacks: ['chips', 'crackers', 'cookies', 'candy', 'nuts', 'popcorn'],
      Frozen: ['ice cream', 'frozen', 'pizza'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => name.includes(kw))) {
        return category;
      }
    }

    return 'Other';
  }
}

/**
 * Build a compact inventory summary for LLM context
 * @param {Object[]} items - Inventory items
 * @returns {string}
 */
function buildInventorySummary(items) {
  if (!items || items.length === 0) {
    return 'Inventory is empty.';
  }

  // Group by location
  const byLocation = {};
  for (const item of items) {
    const loc = item.location || 'other';
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(item);
  }

  // Find expiring items
  const expiringSoon = items.filter(item => {
    if (!item.expirationDate) return false;
    const daysUntil = Math.ceil((new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3;
  });

  let summary = `Total items: ${items.length}\n`;

  // Locations
  summary += 'By location: ';
  summary += Object.entries(byLocation)
    .map(([loc, locItems]) => `${loc}(${locItems.length})`)
    .join(', ');

  // Expiring soon
  if (expiringSoon.length > 0) {
    summary += `\n\nExpiring within 3 days: ${expiringSoon.map(i => i.name).join(', ')}`;
  }

  return summary;
}

module.exports = {
  InventoryIntentProcessor,
  buildInventorySummary,
  INVENTORY_TOOLS,
};
