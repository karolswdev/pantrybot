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
};
