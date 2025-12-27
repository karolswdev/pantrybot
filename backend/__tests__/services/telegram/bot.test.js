/**
 * Tests for Telegram Bot Service
 */

const { TelegramBot, getBot } = require('../../../services/telegram/bot');

// Mock dependencies
jest.mock('../../../lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../lib/llm', () => ({
  InventoryIntentProcessor: jest.fn().mockImplementation(() => ({
    process: jest.fn(),
  })),
  buildInventorySummary: jest.fn().mockReturnValue('Test inventory summary'),
  isLLMConfigured: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../repositories', () => ({
  prisma: {
    telegramLink: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    inventoryItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    itemHistory: {
      create: jest.fn(),
    },
  },
}));

// Mock global fetch
global.fetch = jest.fn();

const { prisma } = require('../../../repositories');
const { InventoryIntentProcessor, isLLMConfigured } = require('../../../lib/llm');

describe('TelegramBot', () => {
  let bot;

  beforeEach(() => {
    jest.clearAllMocks();
    bot = new TelegramBot({ token: 'test-token' });
  });

  describe('constructor', () => {
    it('should set token from options', () => {
      expect(bot.token).toBe('test-token');
    });

    it('should create InventoryIntentProcessor', () => {
      expect(bot.processor).toBeDefined();
    });

    it('should initialize empty userSessions map', () => {
      expect(bot.userSessions).toBeInstanceOf(Map);
      expect(bot.userSessions.size).toBe(0);
    });
  });

  describe('isConfigured', () => {
    it('should return true when token is set', () => {
      expect(bot.isConfigured()).toBe(true);
    });

    it('should return false when token is not set', () => {
      const unconfiguredBot = new TelegramBot({});
      expect(unconfiguredBot.isConfigured()).toBe(false);
    });
  });

  describe('apiCall', () => {
    it('should make correct API request', async () => {
      global.fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ ok: true, result: { id: 123 } }),
      });

      const result = await bot.apiCall('getMe');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-token/getMe',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ id: 123 });
    });

    it('should throw error when response is not ok', async () => {
      global.fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ ok: false, description: 'Bad Request' }),
      });

      await expect(bot.apiCall('getMe')).rejects.toThrow('Telegram API error: Bad Request');
    });

    it('should throw error when not configured', async () => {
      const unconfiguredBot = new TelegramBot({});

      await expect(unconfiguredBot.apiCall('getMe')).rejects.toThrow('Telegram bot not configured');
    });
  });

  describe('setWebhook', () => {
    it('should call setWebhook API with URL', async () => {
      global.fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ ok: true, result: true }),
      });

      await bot.setWebhook('https://example.com/webhook');

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.url).toBe('https://example.com/webhook');
      expect(callBody.allowed_updates).toContain('message');
    });

    it('should throw error when no URL provided', async () => {
      const botNoUrl = new TelegramBot({ token: 'test-token' });
      await expect(botNoUrl.setWebhook()).rejects.toThrow('No webhook URL provided');
    });
  });

  describe('sendMessage', () => {
    it('should send message with correct parameters', async () => {
      global.fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
      });

      await bot.sendMessage(12345, 'Hello World');

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.chat_id).toBe(12345);
      expect(callBody.text).toBe('Hello World');
      expect(callBody.parse_mode).toBe('HTML');
    });
  });

  describe('handleUpdate', () => {
    it('should handle message updates', async () => {
      const handleMessageSpy = jest.spyOn(bot, 'handleMessage').mockResolvedValue();

      await bot.handleUpdate({
        update_id: 1,
        message: { chat: { id: 123 }, text: 'hello', from: { id: 456 } },
      });

      expect(handleMessageSpy).toHaveBeenCalled();
    });

    it('should handle callback_query updates', async () => {
      const handleCallbackSpy = jest.spyOn(bot, 'handleCallbackQuery').mockResolvedValue();

      await bot.handleUpdate({
        update_id: 1,
        callback_query: { id: '123', message: { chat: { id: 123 } }, data: 'test' },
      });

      expect(handleCallbackSpy).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
      });
    });

    it('should ignore non-text messages', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage');

      await bot.handleMessage({
        chat: { id: 123 },
        from: { id: 456 },
        // No text field
      });

      expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('should route commands to handleCommand', async () => {
      const handleCommandSpy = jest.spyOn(bot, 'handleCommand').mockResolvedValue();

      await bot.handleMessage({
        chat: { id: 123 },
        from: { id: 456 },
        text: '/help',
      });

      expect(handleCommandSpy).toHaveBeenCalledWith(123, '456', '/help', { id: 456 });
    });

    it('should route regular messages to processInventoryMessage', async () => {
      const processSpy = jest.spyOn(bot, 'processInventoryMessage').mockResolvedValue();

      await bot.handleMessage({
        chat: { id: 123 },
        from: { id: 456 },
        text: 'I bought milk',
      });

      expect(processSpy).toHaveBeenCalledWith(123, '456', 'I bought milk');
    });
  });

  describe('handleCommand', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ ok: true, result: {} }),
      });
    });

    it('should handle /start command', async () => {
      const handleStartSpy = jest.spyOn(bot, 'handleStart').mockResolvedValue();

      await bot.handleCommand(123, '456', '/start', { id: 456, first_name: 'John' });

      expect(handleStartSpy).toHaveBeenCalledWith(123, '456', { id: 456, first_name: 'John' });
    });

    it('should handle /link command with code', async () => {
      const handleLinkSpy = jest.spyOn(bot, 'handleLink').mockResolvedValue();

      await bot.handleCommand(123, '456', '/link ABC123', { id: 456 });

      expect(handleLinkSpy).toHaveBeenCalledWith(123, '456', 'ABC123');
    });

    it('should handle /status command', async () => {
      const handleStatusSpy = jest.spyOn(bot, 'handleStatus').mockResolvedValue();

      await bot.handleCommand(123, '456', '/status', { id: 456 });

      expect(handleStatusSpy).toHaveBeenCalledWith(123, '456');
    });

    it('should handle /inventory command', async () => {
      const handleInventorySpy = jest.spyOn(bot, 'handleInventoryList').mockResolvedValue();

      await bot.handleCommand(123, '456', '/inventory', { id: 456 });

      expect(handleInventorySpy).toHaveBeenCalledWith(123, '456');
    });

    it('should handle /expiring command', async () => {
      const handleExpiringSpy = jest.spyOn(bot, 'handleExpiringItems').mockResolvedValue();

      await bot.handleCommand(123, '456', '/expiring', { id: 456 });

      expect(handleExpiringSpy).toHaveBeenCalledWith(123, '456');
    });

    it('should handle /help command', async () => {
      const handleHelpSpy = jest.spyOn(bot, 'handleHelp').mockResolvedValue();

      await bot.handleCommand(123, '456', '/help', { id: 456 });

      expect(handleHelpSpy).toHaveBeenCalledWith(123);
    });

    it('should respond to unknown commands', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage').mockResolvedValue();

      await bot.handleCommand(123, '456', '/unknowncommand', { id: 456 });

      expect(sendMessageSpy).toHaveBeenCalledWith(
        123,
        expect.stringContaining("don't recognize")
      );
    });
  });

  describe('handleStart', () => {
    it('should send welcome message with user name', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage').mockResolvedValue();

      await bot.handleStart(123, '456', { first_name: 'Alice' });

      expect(sendMessageSpy).toHaveBeenCalledWith(
        123,
        expect.stringContaining('Alice')
      );
    });

    it('should use default name when first_name is missing', async () => {
      const sendMessageSpy = jest.spyOn(bot, 'sendMessage').mockResolvedValue();

      await bot.handleStart(123, '456', {});

      expect(sendMessageSpy).toHaveBeenCalledWith(
        123,
        expect.stringContaining('there')
      );
    });
  });

  describe('handleLink', () => {
    beforeEach(() => {
      jest.spyOn(bot, 'sendMessage').mockResolvedValue();
    });

    it('should prompt for code when none provided', async () => {
      await bot.handleLink(123, '456', '');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('need a link code')
      );
    });

    it('should reject invalid link code', async () => {
      prisma.telegramLink.findFirst.mockResolvedValue(null);

      await bot.handleLink(123, '456', 'INVALID');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('Invalid or expired')
      );
    });

    it('should link account with valid code', async () => {
      prisma.telegramLink.findFirst.mockResolvedValue({
        id: 'link-1',
        code: 'VALID123',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
          householdMemberships: [{ household: { id: 'hh-1', name: 'Test Household' } }],
        },
      });
      prisma.telegramLink.update.mockResolvedValue({});

      await bot.handleLink(123, '456', 'VALID123');

      expect(prisma.telegramLink.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'link-1' },
          data: expect.objectContaining({
            used: true,
            telegramId: '456',
          }),
        })
      );

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('linked successfully')
      );
    });
  });

  describe('handleStatus', () => {
    beforeEach(() => {
      jest.spyOn(bot, 'sendMessage').mockResolvedValue();
    });

    it('should show not linked message when no session', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue(null);

      await bot.handleStatus(123, '456');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('not linked')
      );
    });

    it('should show status when linked', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue({
        userId: 'user-1',
        householdId: 'hh-1',
        householdName: 'My Household',
      });
      isLLMConfigured.mockReturnValue(true);

      await bot.handleStatus(123, '456');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('My Household')
      );
    });
  });

  describe('handleInventoryList', () => {
    beforeEach(() => {
      jest.spyOn(bot, 'sendMessage').mockResolvedValue();
      jest.spyOn(bot, 'sendTyping').mockResolvedValue();
    });

    it('should prompt to link when no session', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue(null);

      await bot.handleInventoryList(123, '456');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('link your account')
      );
    });

    it('should show empty inventory message', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue({ householdId: 'hh-1' });
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      await bot.handleInventoryList(123, '456');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('empty')
      );
    });

    it('should show grouped inventory', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue({ householdId: 'hh-1' });
      prisma.inventoryItem.findMany.mockResolvedValue([
        { name: 'Milk', location: 'fridge', quantity: 1 },
        { name: 'Bread', location: 'pantry', quantity: 2 },
      ]);

      await bot.handleInventoryList(123, '456');

      expect(bot.sendTyping).toHaveBeenCalledWith(123);
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('Milk')
      );
    });
  });

  describe('handleExpiringItems', () => {
    beforeEach(() => {
      jest.spyOn(bot, 'sendMessage').mockResolvedValue();
      jest.spyOn(bot, 'sendTyping').mockResolvedValue();
    });

    it('should prompt to link when no session', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue(null);

      await bot.handleExpiringItems(123, '456');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('link your account')
      );
    });

    it('should show no expiring items message', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue({ householdId: 'hh-1' });
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      await bot.handleExpiringItems(123, '456');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('Nothing expiring')
      );
    });

    it('should show expiring items', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue({ householdId: 'hh-1' });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      prisma.inventoryItem.findMany.mockResolvedValue([
        { name: 'Milk', expirationDate: tomorrow },
      ]);

      await bot.handleExpiringItems(123, '456');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('Milk')
      );
    });
  });

  describe('handleHelp', () => {
    it('should send help message', async () => {
      jest.spyOn(bot, 'sendMessage').mockResolvedValue();

      await bot.handleHelp(123);

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('/start')
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('/link')
      );
    });
  });

  describe('processInventoryMessage', () => {
    beforeEach(() => {
      jest.spyOn(bot, 'sendMessage').mockResolvedValue();
      jest.spyOn(bot, 'sendTyping').mockResolvedValue();
    });

    it('should prompt to link when no session', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue(null);

      await bot.processInventoryMessage(123, '456', 'I bought milk');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining('link your Pantrybot account')
      );
    });

    it('should prompt when LLM not configured', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue({ householdId: 'hh-1' });
      isLLMConfigured.mockReturnValue(false);

      await bot.processInventoryMessage(123, '456', 'I bought milk');

      expect(bot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("isn't configured")
      );
    });

    it('should process message and send response', async () => {
      jest.spyOn(bot, 'getSession').mockResolvedValue({
        householdId: 'hh-1',
        userId: 'user-1',
      });
      isLLMConfigured.mockReturnValue(true);
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      const processorMock = {
        process: jest.fn().mockResolvedValue({
          action: 'unknown',
          items: [],
          response: 'Got it!',
        }),
      };
      bot.processor = processorMock;

      await bot.processInventoryMessage(123, '456', 'Hello');

      expect(processorMock.process).toHaveBeenCalled();
      expect(bot.sendMessage).toHaveBeenCalledWith(123, 'Got it!');
    });
  });

  describe('executeIntent', () => {
    it('should add items for add intent', async () => {
      prisma.inventoryItem.create.mockResolvedValue({ id: 'item-1' });
      prisma.itemHistory.create.mockResolvedValue({});

      await bot.executeIntent(
        {
          action: 'add',
          items: [{ name: 'Milk', quantity: 1 }],
        },
        'hh-1',
        'user-1'
      );

      expect(prisma.inventoryItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Milk',
          householdId: 'hh-1',
        }),
      });
      expect(prisma.itemHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'created',
        }),
      });
    });

    it('should consume items for consume intent', async () => {
      prisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Milk',
        quantity: 2,
      });
      prisma.itemHistory.create.mockResolvedValue({});
      prisma.inventoryItem.update.mockResolvedValue({});

      await bot.executeIntent(
        {
          action: 'consume',
          items: [{ name: 'Milk', quantity: 1 }],
        },
        'hh-1',
        'user-1'
      );

      expect(prisma.itemHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'consumed',
        }),
      });
      expect(prisma.inventoryItem.update).toHaveBeenCalled();
    });

    it('should delete item when fully consumed', async () => {
      prisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Milk',
        quantity: 1,
      });
      prisma.itemHistory.create.mockResolvedValue({});
      prisma.inventoryItem.delete.mockResolvedValue({});

      await bot.executeIntent(
        {
          action: 'consume',
          items: [{ name: 'Milk' }], // No quantity = consume all
        },
        'hh-1',
        'user-1'
      );

      expect(prisma.inventoryItem.delete).toHaveBeenCalled();
    });

    it('should waste items for waste intent', async () => {
      prisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Lettuce',
        quantity: 1,
      });
      prisma.itemHistory.create.mockResolvedValue({});
      prisma.inventoryItem.delete.mockResolvedValue({});

      await bot.executeIntent(
        {
          action: 'waste',
          items: [{ name: 'Lettuce', reason: 'expired' }],
        },
        'hh-1',
        'user-1'
      );

      expect(prisma.itemHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'wasted',
          reason: 'expired',
        }),
      });
    });
  });

  describe('getSession', () => {
    it('should return cached session', async () => {
      const session = { userId: 'user-1', householdId: 'hh-1' };
      bot.userSessions.set('456', session);

      const result = await bot.getSession('456');

      expect(result).toBe(session);
      expect(prisma.telegramLink.findFirst).not.toHaveBeenCalled();
    });

    it('should look up session from database', async () => {
      prisma.telegramLink.findFirst.mockResolvedValue({
        user: {
          id: 'user-1',
          householdMemberships: [
            { household: { id: 'hh-1', name: 'Test Household' } },
          ],
        },
      });

      const result = await bot.getSession('456');

      expect(result).toEqual({
        userId: 'user-1',
        householdId: 'hh-1',
        householdName: 'Test Household',
      });

      // Should cache the result
      expect(bot.userSessions.get('456')).toEqual(result);
    });

    it('should return null when no link found', async () => {
      prisma.telegramLink.findFirst.mockResolvedValue(null);

      const result = await bot.getSession('456');

      expect(result).toBeNull();
    });
  });
});

describe('getBot', () => {
  it('should return singleton instance', () => {
    const bot1 = getBot();
    const bot2 = getBot();

    expect(bot1).toBe(bot2);
  });
});
