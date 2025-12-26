/**
 * Telegram Bot Service
 *
 * Provides conversational inventory management via Telegram.
 * Integrates with the InventoryIntentProcessor for natural language understanding.
 */

const { logger } = require('../../lib/logger');
const {
  InventoryIntentProcessor,
  buildInventorySummary,
  isLLMConfigured,
} = require('../../lib/llm');
const { prisma } = require('../../repositories');

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

class TelegramBot {
  /**
   * @param {Object} options
   * @param {string} options.token - Telegram bot token
   * @param {string} [options.webhookUrl] - Webhook URL for receiving updates
   */
  constructor(options = {}) {
    this.token = options.token || process.env.TELEGRAM_BOT_TOKEN;
    this.webhookUrl = options.webhookUrl || process.env.TELEGRAM_WEBHOOK_URL;
    this.processor = new InventoryIntentProcessor();

    // Cache for user sessions (telegramId -> { householdId, userId })
    this.userSessions = new Map();

    if (!this.token) {
      logger.warn('TELEGRAM_BOT_TOKEN not set - Telegram bot disabled');
    }
  }

  /**
   * Check if bot is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.token;
  }

  /**
   * Make a Telegram API request
   * @param {string} method - API method name
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>}
   */
  async apiCall(method, params = {}) {
    if (!this.token) {
      throw new Error('Telegram bot not configured');
    }

    const url = `${TELEGRAM_API_BASE}${this.token}/${method}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      return data.result;
    } catch (error) {
      logger.error({ error: error.message, method }, 'Telegram API call failed');
      throw error;
    }
  }

  /**
   * Set up webhook for receiving updates
   * @param {string} [url] - Webhook URL (defaults to configured URL)
   * @returns {Promise<boolean>}
   */
  async setWebhook(url) {
    const webhookUrl = url || this.webhookUrl;

    if (!webhookUrl) {
      throw new Error('No webhook URL provided');
    }

    const result = await this.apiCall('setWebhook', {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
    });

    logger.info({ webhookUrl }, 'Telegram webhook set');
    return result;
  }

  /**
   * Remove webhook
   * @returns {Promise<boolean>}
   */
  async deleteWebhook() {
    const result = await this.apiCall('deleteWebhook');
    logger.info('Telegram webhook deleted');
    return result;
  }

  /**
   * Get bot information
   * @returns {Promise<Object>}
   */
  async getMe() {
    return this.apiCall('getMe');
  }

  /**
   * Send a message to a chat
   * @param {number|string} chatId - Chat ID
   * @param {string} text - Message text
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>}
   */
  async sendMessage(chatId, text, options = {}) {
    return this.apiCall('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: options.parseMode || 'HTML',
      reply_markup: options.replyMarkup,
      ...options,
    });
  }

  /**
   * Send a typing indicator
   * @param {number|string} chatId - Chat ID
   */
  async sendTyping(chatId) {
    try {
      await this.apiCall('sendChatAction', {
        chat_id: chatId,
        action: 'typing',
      });
    } catch (error) {
      // Ignore typing indicator errors
    }
  }

  /**
   * Handle incoming webhook update
   * @param {Object} update - Telegram update object
   * @returns {Promise<void>}
   */
  async handleUpdate(update) {
    logger.debug({ updateId: update.update_id }, 'Processing Telegram update');

    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      logger.error({ error: error.message, updateId: update.update_id }, 'Failed to handle update');
    }
  }

  /**
   * Handle incoming message
   * @param {Object} message - Telegram message object
   */
  async handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text;
    const telegramId = message.from.id.toString();

    if (!text) {
      return; // Ignore non-text messages for now
    }

    logger.info({ chatId, telegramId, text: text.substring(0, 50) }, 'Received Telegram message');

    // Handle commands
    if (text.startsWith('/')) {
      await this.handleCommand(chatId, telegramId, text, message.from);
      return;
    }

    // Process natural language message
    await this.processInventoryMessage(chatId, telegramId, text);
  }

  /**
   * Handle bot commands
   * @param {number} chatId - Chat ID
   * @param {string} telegramId - Telegram user ID
   * @param {string} command - Command text
   * @param {Object} from - Telegram user object
   */
  async handleCommand(chatId, telegramId, command, from) {
    const cmd = command.split(' ')[0].toLowerCase();
    const args = command.substring(cmd.length).trim();

    switch (cmd) {
      case '/start':
        await this.handleStart(chatId, telegramId, from);
        break;

      case '/link':
        await this.handleLink(chatId, telegramId, args);
        break;

      case '/status':
        await this.handleStatus(chatId, telegramId);
        break;

      case '/inventory':
        await this.handleInventoryList(chatId, telegramId);
        break;

      case '/expiring':
        await this.handleExpiringItems(chatId, telegramId);
        break;

      case '/help':
        await this.handleHelp(chatId);
        break;

      default:
        await this.sendMessage(chatId, "I don't recognize that command. Try /help for available commands.");
    }
  }

  /**
   * Handle /start command
   */
  async handleStart(chatId, telegramId, from) {
    const firstName = from.first_name || 'there';

    const welcomeMessage = `
<b>Welcome to Pantrybot, ${firstName}!</b> 🥕

I'm your kitchen inventory assistant. I help you track what's in your fridge, freezer, and pantry so you can reduce food waste.

<b>Getting Started:</b>
1. Link your Pantrybot account with /link
2. Then just tell me about your groceries!

<b>Examples:</b>
• "I bought milk, eggs, and bread"
• "Used the chicken for dinner"
• "The lettuce went bad"
• "What's expiring soon?"

Type /help for more commands.
    `.trim();

    await this.sendMessage(chatId, welcomeMessage);
  }

  /**
   * Handle /link command - Link Telegram account to Pantrybot
   */
  async handleLink(chatId, telegramId, linkCode) {
    if (!linkCode) {
      await this.sendMessage(
        chatId,
        `To link your account, you need a link code from the Pantrybot web app.

1. Go to your Pantrybot settings
2. Find "Telegram Integration"
3. Copy the link code
4. Send: /link YOUR_CODE`
      );
      return;
    }

    try {
      // Look up the link code in the database
      const linkRequest = await prisma.telegramLink.findFirst({
        where: {
          code: linkCode,
          used: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              householdMemberships: {
                include: { household: true },
                take: 1,
              },
            },
          },
        },
      });

      if (!linkRequest) {
        await this.sendMessage(chatId, 'Invalid or expired link code. Please generate a new one from the app.');
        return;
      }

      // Mark link as used and save Telegram ID
      await prisma.telegramLink.update({
        where: { id: linkRequest.id },
        data: {
          used: true,
          telegramId,
          telegramChatId: chatId.toString(),
        },
      });

      // Save session
      const household = linkRequest.user.householdMemberships[0]?.household;
      if (household) {
        this.userSessions.set(telegramId, {
          userId: linkRequest.user.id,
          householdId: household.id,
        });
      }

      await this.sendMessage(
        chatId,
        `Account linked successfully! You're connected as <b>${linkRequest.user.displayName || linkRequest.user.email}</b>.

You can now manage your inventory by just sending me messages. Try saying "I bought some apples"!`
      );
    } catch (error) {
      logger.error({ error: error.message, telegramId }, 'Failed to link account');
      await this.sendMessage(chatId, 'Something went wrong linking your account. Please try again.');
    }
  }

  /**
   * Handle /status command
   */
  async handleStatus(chatId, telegramId) {
    const session = await this.getSession(telegramId);

    if (!session) {
      await this.sendMessage(
        chatId,
        'Your account is not linked yet. Use /link to connect your Pantrybot account.'
      );
      return;
    }

    const llmStatus = isLLMConfigured() ? 'Available' : 'Not configured';

    await this.sendMessage(
      chatId,
      `<b>Status</b>

Account: Linked
Household: ${session.householdName || 'Unknown'}
LLM Processing: ${llmStatus}`
    );
  }

  /**
   * Handle /inventory command - List inventory summary
   */
  async handleInventoryList(chatId, telegramId) {
    const session = await this.getSession(telegramId);

    if (!session) {
      await this.sendMessage(chatId, 'Please link your account first with /link');
      return;
    }

    await this.sendTyping(chatId);

    try {
      const items = await prisma.inventoryItem.findMany({
        where: { householdId: session.householdId },
        orderBy: { expirationDate: 'asc' },
      });

      if (items.length === 0) {
        await this.sendMessage(chatId, "Your inventory is empty. Tell me when you buy groceries!");
        return;
      }

      // Group by location
      const byLocation = {};
      for (const item of items) {
        const loc = item.location || 'other';
        if (!byLocation[loc]) byLocation[loc] = [];
        byLocation[loc].push(item);
      }

      let message = `<b>Your Inventory</b> (${items.length} items)\n\n`;

      const locationEmojis = {
        fridge: '🧊',
        freezer: '❄️',
        pantry: '🏠',
        other: '📦',
      };

      for (const [location, locItems] of Object.entries(byLocation)) {
        const emoji = locationEmojis[location] || '📦';
        message += `${emoji} <b>${location.charAt(0).toUpperCase() + location.slice(1)}</b>\n`;

        for (const item of locItems.slice(0, 5)) {
          const qty = item.quantity > 1 ? ` (${item.quantity})` : '';
          message += `  • ${item.name}${qty}\n`;
        }

        if (locItems.length > 5) {
          message += `  <i>...and ${locItems.length - 5} more</i>\n`;
        }
        message += '\n';
      }

      await this.sendMessage(chatId, message);
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to fetch inventory');
      await this.sendMessage(chatId, 'Something went wrong fetching your inventory.');
    }
  }

  /**
   * Handle /expiring command - List items expiring soon
   */
  async handleExpiringItems(chatId, telegramId) {
    const session = await this.getSession(telegramId);

    if (!session) {
      await this.sendMessage(chatId, 'Please link your account first with /link');
      return;
    }

    await this.sendTyping(chatId);

    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const expiringItems = await prisma.inventoryItem.findMany({
        where: {
          householdId: session.householdId,
          expirationDate: {
            lte: threeDaysFromNow,
            gte: new Date(),
          },
        },
        orderBy: { expirationDate: 'asc' },
      });

      if (expiringItems.length === 0) {
        await this.sendMessage(chatId, "Nothing expiring in the next 3 days. You're all good!");
        return;
      }

      let message = `<b>⚠️ Expiring Soon</b>\n\n`;

      for (const item of expiringItems) {
        const daysUntil = Math.ceil(
          (new Date(item.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        let urgency = '';
        if (daysUntil <= 0) urgency = '🔴';
        else if (daysUntil === 1) urgency = '🟠';
        else urgency = '🟡';

        const dayText = daysUntil <= 0 ? 'TODAY' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
        message += `${urgency} <b>${item.name}</b> - expires ${dayText}\n`;
      }

      message += '\nUse these items soon, or tell me when you use them!';

      await this.sendMessage(chatId, message);
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to fetch expiring items');
      await this.sendMessage(chatId, 'Something went wrong checking expiring items.');
    }
  }

  /**
   * Handle /help command
   */
  async handleHelp(chatId) {
    const helpMessage = `
<b>Pantrybot Commands</b>

/start - Welcome message
/link [code] - Link your Pantrybot account
/status - Check connection status
/inventory - View your inventory
/expiring - See what's expiring soon
/help - Show this help

<b>Natural Language</b>

Just tell me about your groceries in plain English:

• "I bought milk and eggs"
• "Got some bananas and apples"
• "Used the chicken"
• "Finished the milk"
• "The lettuce went bad"
• "Threw out old bread"
• "What do I have?"
• "What's in the fridge?"
    `.trim();

    await this.sendMessage(chatId, helpMessage);
  }

  /**
   * Process a natural language inventory message
   */
  async processInventoryMessage(chatId, telegramId, text) {
    const session = await this.getSession(telegramId);

    if (!session) {
      await this.sendMessage(
        chatId,
        "I'd love to help, but you need to link your Pantrybot account first. Use /link to get started!"
      );
      return;
    }

    if (!isLLMConfigured()) {
      await this.sendMessage(
        chatId,
        "Natural language processing isn't configured on this server. Please use the web app or commands like /inventory and /expiring."
      );
      return;
    }

    await this.sendTyping(chatId);

    try {
      // Build context
      const items = await prisma.inventoryItem.findMany({
        where: { householdId: session.householdId },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      });

      const context = {
        householdId: session.householdId,
        inventorySummary: buildInventorySummary(items),
        recentItems: items.slice(0, 10).map(i => i.name),
      };

      // Process with LLM
      const intent = await this.processor.process(text, context);

      // Execute the intent if it's an action
      if (intent.action !== 'unknown' && intent.action !== 'query') {
        await this.executeIntent(intent, session.householdId, session.userId);
      }

      // Send the response
      await this.sendMessage(chatId, intent.response || "I'm not sure what you mean. Could you rephrase?");
    } catch (error) {
      logger.error({ error: error.message, text }, 'Failed to process inventory message');
      await this.sendMessage(
        chatId,
        "Something went wrong processing your message. Try again or use /help for commands."
      );
    }
  }

  /**
   * Execute an inventory intent
   * @param {Object} intent - Parsed intent
   * @param {string} householdId - Household ID
   * @param {string} userId - User ID
   */
  async executeIntent(intent, householdId, userId) {
    switch (intent.action) {
      case 'add':
        for (const item of intent.items) {
          const expirationDate = item.expirationDays
            ? new Date(Date.now() + item.expirationDays * 24 * 60 * 60 * 1000)
            : null;

          const newItem = await prisma.inventoryItem.create({
            data: {
              name: item.name,
              quantity: item.quantity || 1,
              unit: item.unit || 'item',
              location: item.location || 'fridge',
              category: item.category || 'uncategorized',
              expirationDate,
              householdId,
              createdBy: userId,
            },
          });

          // Log the creation
          await prisma.itemHistory.create({
            data: {
              itemId: newItem.id,
              householdId,
              action: 'created',
              quantity: item.quantity || 1,
              userId,
            },
          });
        }
        break;

      case 'consume':
        for (const item of intent.items) {
          const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
              householdId,
              name: { contains: item.name, mode: 'insensitive' },
            },
          });

          if (inventoryItem) {
            const consumeQty = item.quantity || Number(inventoryItem.quantity);
            const remaining = Number(inventoryItem.quantity) - consumeQty;

            // Log the consumption
            await prisma.itemHistory.create({
              data: {
                itemId: inventoryItem.id,
                householdId,
                action: 'consumed',
                quantity: consumeQty,
                userId,
              },
            });

            if (remaining <= 0) {
              await prisma.inventoryItem.delete({ where: { id: inventoryItem.id } });
            } else {
              await prisma.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: { quantity: remaining },
              });
            }
          }
        }
        break;

      case 'waste':
        for (const item of intent.items) {
          const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
              householdId,
              name: { contains: item.name, mode: 'insensitive' },
            },
          });

          if (inventoryItem) {
            const wasteQty = item.quantity || Number(inventoryItem.quantity);
            const remaining = Number(inventoryItem.quantity) - wasteQty;

            // Log the waste
            await prisma.itemHistory.create({
              data: {
                itemId: inventoryItem.id,
                householdId,
                action: 'wasted',
                quantity: wasteQty,
                reason: item.reason || 'expired',
                userId,
              },
            });

            if (remaining <= 0) {
              await prisma.inventoryItem.delete({ where: { id: inventoryItem.id } });
            } else {
              await prisma.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: { quantity: remaining },
              });
            }
          }
        }
        break;
    }
  }

  /**
   * Get user session (from cache or database)
   * @param {string} telegramId - Telegram user ID
   * @returns {Promise<Object|null>}
   */
  async getSession(telegramId) {
    // Check cache first
    if (this.userSessions.has(telegramId)) {
      return this.userSessions.get(telegramId);
    }

    // Look up in database
    try {
      const link = await prisma.telegramLink.findFirst({
        where: {
          telegramId,
          used: true,
        },
        include: {
          user: {
            include: {
              householdMemberships: {
                include: { household: true },
                take: 1,
              },
            },
          },
        },
      });

      if (!link) {
        return null;
      }

      const household = link.user.householdMemberships[0]?.household;
      if (!household) {
        return null;
      }

      const session = {
        userId: link.user.id,
        householdId: household.id,
        householdName: household.name,
      };

      // Cache the session
      this.userSessions.set(telegramId, session);

      return session;
    } catch (error) {
      logger.error({ error: error.message, telegramId }, 'Failed to get session');
      return null;
    }
  }

  /**
   * Handle callback query (button press)
   */
  async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    // Acknowledge the callback
    await this.apiCall('answerCallbackQuery', {
      callback_query_id: callbackQuery.id,
    });

    // Handle the callback data
    logger.debug({ data }, 'Received callback query');
    // Future: Handle inline button actions
  }
}

// Singleton instance
let botInstance = null;

/**
 * Get the Telegram bot instance
 * @returns {TelegramBot}
 */
function getBot() {
  if (!botInstance) {
    botInstance = new TelegramBot();
  }
  return botInstance;
}

module.exports = {
  TelegramBot,
  getBot,
};
