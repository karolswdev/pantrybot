/**
 * Telegram Service
 *
 * Exports the Telegram bot for integration with the main application.
 */

const { TelegramBot, getBot } = require('./bot');

module.exports = {
  TelegramBot,
  getBot,
};
