/**
 * LLM Module
 *
 * Provides a unified interface for interacting with various LLM providers.
 *
 * Usage:
 *   const { getProvider, isLLMConfigured } = require('./lib/llm');
 *
 *   if (isLLMConfigured()) {
 *     const llm = getProvider();
 *     const response = await llm.chat([
 *       { role: 'user', content: 'Hello!' }
 *     ]);
 *   }
 */

const { BaseLLMProvider } = require('./types');
const { OpenAIProvider } = require('./providers/openai');
const { AnthropicProvider } = require('./providers/anthropic');
const { OllamaProvider } = require('./providers/ollama');
const {
  createProvider,
  createSpecificProvider,
  getProvider,
  isLLMConfigured,
  getProviderInfo,
  resetProvider,
} = require('./provider-factory');
const {
  InventoryIntentProcessor,
  buildInventorySummary,
  INVENTORY_TOOLS,
} = require('./inventory-processor');

module.exports = {
  // Base class
  BaseLLMProvider,

  // Providers
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,

  // Factory functions
  createProvider,
  createSpecificProvider,
  getProvider,
  isLLMConfigured,
  getProviderInfo,
  resetProvider,

  // Inventory processing
  InventoryIntentProcessor,
  buildInventorySummary,
  INVENTORY_TOOLS,
};
