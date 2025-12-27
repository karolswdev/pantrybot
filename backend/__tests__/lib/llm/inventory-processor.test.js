/**
 * Tests for Inventory Intent Processor
 */

const {
  InventoryIntentProcessor,
  buildInventorySummary,
  INVENTORY_TOOLS,
} = require('../../../lib/llm/inventory-processor');

// Mock the provider factory
jest.mock('../../../lib/llm/provider-factory', () => ({
  getProvider: jest.fn(),
  isLLMConfigured: jest.fn(),
}));

const { getProvider, isLLMConfigured } = require('../../../lib/llm/provider-factory');

describe('InventoryIntentProcessor', () => {
  let processor;
  let mockProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider = {
      chat: jest.fn(),
    };
    processor = new InventoryIntentProcessor({ provider: mockProvider });
  });

  describe('constructor', () => {
    it('should accept provider option', () => {
      const customProvider = { chat: jest.fn() };
      const p = new InventoryIntentProcessor({ provider: customProvider });
      expect(p.provider).toBe(customProvider);
    });

    it('should work without options', () => {
      const p = new InventoryIntentProcessor();
      expect(p.provider).toBeUndefined();
    });
  });

  describe('_getProvider', () => {
    it('should return provided provider', () => {
      const result = processor._getProvider();
      expect(result).toBe(mockProvider);
    });

    it('should lazy-load provider from factory', () => {
      const lazyProcessor = new InventoryIntentProcessor();
      isLLMConfigured.mockReturnValue(true);
      getProvider.mockReturnValue(mockProvider);

      const result = lazyProcessor._getProvider();

      expect(isLLMConfigured).toHaveBeenCalled();
      expect(getProvider).toHaveBeenCalled();
      expect(result).toBe(mockProvider);
    });

    it('should throw error when no provider configured', () => {
      const lazyProcessor = new InventoryIntentProcessor();
      isLLMConfigured.mockReturnValue(false);

      expect(() => lazyProcessor._getProvider())
        .toThrow('No LLM provider configured');
    });
  });

  describe('process', () => {
    it('should process add_items intent', async () => {
      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'add_items',
          arguments: {
            items: [{ name: 'Milk', quantity: 1 }],
            response: 'Added milk to your fridge!',
          },
        }],
      });

      const result = await processor.process('I bought milk', { householdId: 'test-123' });

      expect(result.action).toBe('add');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Milk');
      expect(result.response).toBe('Added milk to your fridge!');
      expect(result.confidence).toBe(0.9);
    });

    it('should process consume_items intent', async () => {
      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'consume_items',
          arguments: {
            items: [{ name: 'Chicken' }],
            response: 'Marked chicken as consumed!',
          },
        }],
      });

      const result = await processor.process('Used the chicken for dinner');

      expect(result.action).toBe('consume');
      expect(result.items[0].name).toBe('Chicken');
      expect(result.confidence).toBe(0.9);
    });

    it('should process waste_items intent', async () => {
      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'waste_items',
          arguments: {
            items: [{ name: 'Lettuce', reason: 'expired' }],
            response: 'Sorry the lettuce went bad!',
          },
        }],
      });

      const result = await processor.process('The lettuce went bad');

      expect(result.action).toBe('waste');
      expect(result.items[0].name).toBe('Lettuce');
      expect(result.items[0].reason).toBe('expired');
      expect(result.confidence).toBe(0.9);
    });

    it('should process query_inventory intent', async () => {
      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'query_inventory',
          arguments: {
            queryType: 'expiring_soon',
            response: 'You have milk and eggs expiring soon.',
          },
        }],
      });

      const result = await processor.process("What's expiring soon?");

      expect(result.action).toBe('query');
      expect(result.queryType).toBe('expiring_soon');
      expect(result.items).toEqual([]);
      expect(result.confidence).toBe(0.85);
    });

    it('should process suggest_recipes intent', async () => {
      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'suggest_recipes',
          arguments: {
            mealType: 'dinner',
            prioritizeExpiring: true,
            specificIngredients: ['chicken'],
            dietaryRestrictions: ['gluten-free'],
            response: "Let me find some dinner recipes for you!",
          },
        }],
      });

      const result = await processor.process('What can I make for dinner?');

      expect(result.action).toBe('recipe');
      expect(result.recipeRequest).toBeDefined();
      expect(result.recipeRequest.mealType).toBe('dinner');
      expect(result.recipeRequest.prioritizeExpiring).toBe(true);
      expect(result.recipeRequest.specificIngredients).toContain('chicken');
      expect(result.recipeRequest.dietaryRestrictions).toContain('gluten-free');
      expect(result.response).toBe("Let me find some dinner recipes for you!");
      expect(result.confidence).toBe(0.9);
    });

    it('should handle suggest_recipes with minimal arguments', async () => {
      mockProvider.chat.mockResolvedValue({
        toolCalls: [{
          name: 'suggest_recipes',
          arguments: {
            mealType: 'any',
            response: "Here are some recipe ideas!",
          },
        }],
      });

      const result = await processor.process('What can I cook?');

      expect(result.action).toBe('recipe');
      expect(result.recipeRequest.mealType).toBe('any');
      expect(result.recipeRequest.prioritizeExpiring).toBe(true); // default
      expect(result.recipeRequest.specificIngredients).toEqual([]);
      expect(result.recipeRequest.dietaryRestrictions).toEqual([]);
    });

    it('should handle unknown intents gracefully', async () => {
      mockProvider.chat.mockResolvedValue({
        content: 'Hello! How can I help you today?',
      });

      const result = await processor.process('Hello there');

      expect(result.action).toBe('unknown');
      expect(result.items).toEqual([]);
      expect(result.confidence).toBe(0.5);
    });

    it('should handle provider errors', async () => {
      mockProvider.chat.mockRejectedValue(new Error('API error'));

      const result = await processor.process('Add milk');

      expect(result.action).toBe('unknown');
      expect(result.confidence).toBe(0);
      expect(result.response).toContain('trouble understanding');
    });

    it('should pass inventory context to LLM', async () => {
      mockProvider.chat.mockResolvedValue({ content: 'OK' });

      await processor.process('What do I have?', {
        householdId: 'test-123',
        inventorySummary: 'You have 5 items.',
        recentItems: ['Milk', 'Eggs'],
      });

      const systemMessage = mockProvider.chat.mock.calls[0][0][0].content;
      expect(systemMessage).toContain('You have 5 items.');
      expect(systemMessage).toContain('Milk');
      expect(systemMessage).toContain('Eggs');
    });

    it('should use low temperature for consistent parsing', async () => {
      mockProvider.chat.mockResolvedValue({ content: 'OK' });

      await processor.process('Add milk');

      const options = mockProvider.chat.mock.calls[0][1];
      expect(options.temperature).toBe(0.2);
    });

    it('should include inventory tools', async () => {
      mockProvider.chat.mockResolvedValue({ content: 'OK' });

      await processor.process('Add milk');

      const options = mockProvider.chat.mock.calls[0][1];
      expect(options.tools).toBeDefined();
      expect(options.tools.length).toBeGreaterThan(0);
    });
  });

  describe('_buildSystemPrompt', () => {
    it('should include inventory summary when provided', () => {
      const result = processor._buildSystemPrompt({
        inventorySummary: 'You have milk and eggs.',
      });

      expect(result).toContain('You have milk and eggs.');
    });

    it('should include recent items when provided', () => {
      const result = processor._buildSystemPrompt({
        recentItems: ['Milk', 'Eggs', 'Cheese'],
      });

      expect(result).toContain('Recently active items:');
      expect(result).toContain('Milk');
      expect(result).toContain('Eggs');
      expect(result).toContain('Cheese');
    });

    it('should show default message when no context', () => {
      const result = processor._buildSystemPrompt({});

      expect(result).toContain('No inventory data available.');
    });
  });

  describe('_normalizeItems', () => {
    it('should add default values to items', () => {
      const items = [{ name: 'Milk' }];
      const result = processor._normalizeItems(items);

      expect(result[0].quantity).toBe(1);
      expect(result[0].unit).toBe('item');
      expect(result[0].location).toBeDefined();
      expect(result[0].expirationDays).toBeDefined();
      expect(result[0].category).toBeDefined();
    });

    it('should preserve existing values', () => {
      const items = [{
        name: 'Organic Milk',
        quantity: 2,
        unit: 'gal',
        location: 'fridge',
        expirationDays: 10,
        category: 'Dairy',
      }];
      const result = processor._normalizeItems(items);

      expect(result[0].quantity).toBe(2);
      expect(result[0].unit).toBe('gal');
      expect(result[0].location).toBe('fridge');
      expect(result[0].expirationDays).toBe(10);
      expect(result[0].category).toBe('Dairy');
    });

    it('should include reason for waste items', () => {
      const items = [{ name: 'Lettuce', reason: 'spoiled' }];
      const result = processor._normalizeItems(items, true);

      expect(result[0].reason).toBe('spoiled');
    });

    it('should not include reason for non-waste items', () => {
      const items = [{ name: 'Lettuce', reason: 'spoiled' }];
      const result = processor._normalizeItems(items, false);

      expect(result[0].reason).toBeUndefined();
    });
  });

  describe('_inferLocation', () => {
    it('should infer freezer for frozen items', () => {
      expect(processor._inferLocation('Frozen Pizza')).toBe('freezer');
      expect(processor._inferLocation('Ice Cream')).toBe('freezer');
      expect(processor._inferLocation('Freezer Waffles')).toBe('freezer');
    });

    it('should infer pantry for dry goods', () => {
      expect(processor._inferLocation('Rice')).toBe('pantry');
      expect(processor._inferLocation('Pasta')).toBe('pantry');
      expect(processor._inferLocation('Canned Beans')).toBe('pantry');
      expect(processor._inferLocation('Cereal')).toBe('pantry');
      expect(processor._inferLocation('Chips')).toBe('pantry');
      expect(processor._inferLocation('Peanut Butter')).toBe('pantry');
    });

    it('should default to fridge for fresh items', () => {
      expect(processor._inferLocation('Milk')).toBe('fridge');
      expect(processor._inferLocation('Cheese')).toBe('fridge');
      expect(processor._inferLocation('Chicken')).toBe('fridge');
    });
  });

  describe('_inferExpiration', () => {
    it('should return short expiration for delicate produce', () => {
      expect(processor._inferExpiration('Lettuce')).toBe(3);
      expect(processor._inferExpiration('Strawberries')).toBe(3);
      expect(processor._inferExpiration('Fresh Spinach')).toBe(3);
    });

    it('should return week for dairy', () => {
      expect(processor._inferExpiration('Milk')).toBe(7);
      expect(processor._inferExpiration('Yogurt')).toBe(7);
    });

    it('should return two weeks for eggs and cheese', () => {
      expect(processor._inferExpiration('Eggs')).toBe(14);
      expect(processor._inferExpiration('Cheddar Cheese')).toBe(14);
    });

    it('should return long expiration for freezer items', () => {
      expect(processor._inferExpiration('Any Item', 'freezer')).toBe(90);
    });

    it('should return long expiration for pantry items', () => {
      expect(processor._inferExpiration('Any Item', 'pantry')).toBe(180);
    });

    it('should default to 7 days for unknown fridge items', () => {
      expect(processor._inferExpiration('Unknown Item')).toBe(7);
    });
  });

  describe('_inferCategory', () => {
    it('should categorize dairy items', () => {
      expect(processor._inferCategory('Milk')).toBe('Dairy');
      expect(processor._inferCategory('Cheese')).toBe('Dairy');
      expect(processor._inferCategory('Yogurt')).toBe('Dairy');
    });

    it('should categorize produce', () => {
      expect(processor._inferCategory('Apple')).toBe('Produce');
      expect(processor._inferCategory('Broccoli')).toBe('Produce');
      expect(processor._inferCategory('Spinach')).toBe('Produce');
    });

    it('should categorize meat', () => {
      expect(processor._inferCategory('Chicken Breast')).toBe('Meat');
      expect(processor._inferCategory('Ground Beef')).toBe('Meat');
      expect(processor._inferCategory('Salmon')).toBe('Meat');
    });

    it('should categorize grains', () => {
      expect(processor._inferCategory('Bread')).toBe('Grains');
      expect(processor._inferCategory('Rice')).toBe('Grains');
      expect(processor._inferCategory('Pasta')).toBe('Grains');
    });

    it('should categorize beverages', () => {
      expect(processor._inferCategory('Coffee')).toBe('Beverages');
      expect(processor._inferCategory('Soda')).toBe('Beverages');
      expect(processor._inferCategory('Green Tea')).toBe('Beverages');
    });

    it('should categorize condiments', () => {
      expect(processor._inferCategory('Ketchup')).toBe('Condiments');
      expect(processor._inferCategory('Mustard')).toBe('Condiments');
    });

    it('should categorize snacks', () => {
      expect(processor._inferCategory('Chips')).toBe('Snacks');
      expect(processor._inferCategory('Cookies')).toBe('Snacks');
    });

    it('should return Other for unknown items', () => {
      expect(processor._inferCategory('Some Random Thing')).toBe('Other');
    });
  });
});

describe('buildInventorySummary', () => {
  it('should return empty message for no items', () => {
    expect(buildInventorySummary([])).toBe('Inventory is empty.');
    expect(buildInventorySummary(null)).toBe('Inventory is empty.');
  });

  it('should show total item count', () => {
    const items = [
      { name: 'Milk', location: 'fridge' },
      { name: 'Bread', location: 'pantry' },
    ];

    const result = buildInventorySummary(items);
    expect(result).toContain('Total items: 2');
  });

  it('should group items by location', () => {
    const items = [
      { name: 'Milk', location: 'fridge' },
      { name: 'Eggs', location: 'fridge' },
      { name: 'Bread', location: 'pantry' },
    ];

    const result = buildInventorySummary(items);
    expect(result).toContain('fridge(2)');
    expect(result).toContain('pantry(1)');
  });

  it('should highlight expiring items', () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const items = [
      { name: 'Fresh Milk', location: 'fridge', expirationDate: tomorrow.toISOString() },
      { name: 'Bread', location: 'pantry' },
    ];

    const result = buildInventorySummary(items);
    expect(result).toContain('Expiring within 3 days');
    expect(result).toContain('Fresh Milk');
  });

  it('should handle items without location', () => {
    const items = [
      { name: 'Mystery Item' },
    ];

    const result = buildInventorySummary(items);
    expect(result).toContain('other(1)');
  });
});

describe('INVENTORY_TOOLS', () => {
  it('should have all required tools', () => {
    const toolNames = INVENTORY_TOOLS.map(t => t.name);

    expect(toolNames).toContain('add_items');
    expect(toolNames).toContain('consume_items');
    expect(toolNames).toContain('waste_items');
    expect(toolNames).toContain('query_inventory');
    expect(toolNames).toContain('suggest_recipes');
  });

  it('should have suggest_recipes tool with correct structure', () => {
    const recipeTool = INVENTORY_TOOLS.find(t => t.name === 'suggest_recipes');

    expect(recipeTool).toBeDefined();
    expect(recipeTool.description).toContain('recipe');
    expect(recipeTool.parameters.properties.mealType).toBeDefined();
    expect(recipeTool.parameters.properties.mealType.enum).toContain('dinner');
    expect(recipeTool.parameters.properties.prioritizeExpiring).toBeDefined();
    expect(recipeTool.parameters.properties.specificIngredients).toBeDefined();
    expect(recipeTool.parameters.properties.dietaryRestrictions).toBeDefined();
    expect(recipeTool.parameters.required).toContain('mealType');
    expect(recipeTool.parameters.required).toContain('response');
  });

  it('should have proper structure for each tool', () => {
    for (const tool of INVENTORY_TOOLS) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.parameters).toBeDefined();
      expect(tool.parameters.type).toBe('object');
      expect(tool.parameters.required).toContain('response');
    }
  });

  it('should have items array in add/consume/waste tools', () => {
    const actionTools = INVENTORY_TOOLS.filter(t =>
      ['add_items', 'consume_items', 'waste_items'].includes(t.name)
    );

    for (const tool of actionTools) {
      expect(tool.parameters.properties.items).toBeDefined();
      expect(tool.parameters.properties.items.type).toBe('array');
    }
  });
});
