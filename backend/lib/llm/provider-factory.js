/**
 * LLM Provider Factory
 *
 * Automatically selects and configures the appropriate LLM provider
 * based on environment variables.
 *
 * Priority order:
 * 1. Explicit LLM_PROVIDER env var
 * 2. Ollama (if OLLAMA_BASE_URL is set)
 * 3. Anthropic (if ANTHROPIC_API_KEY is set)
 * 4. OpenAI (if OPENAI_API_KEY is set)
 */

const { OpenAIProvider } = require('./providers/openai');
const { AnthropicProvider } = require('./providers/anthropic');
const { OllamaProvider } = require('./providers/ollama');
const { logger } = require('../logger');

/**
 * @typedef {Object} LLMConfig
 * @property {'openai' | 'anthropic' | 'ollama' | 'auto'} [provider='auto'] - Provider to use
 * @property {string} [model] - Override default model
 * @property {string} [apiKey] - API key (overrides env var)
 * @property {string} [baseUrl] - Base URL (overrides env var)
 */

let cachedProvider = null;

/**
 * Create an LLM provider based on configuration and environment
 * @param {LLMConfig} [config={}] - Optional configuration overrides
 * @returns {import('./types').BaseLLMProvider}
 */
function createProvider(config = {}) {
  const explicitProvider = config.provider || process.env.LLM_PROVIDER;

  // If explicitly specified, use that provider
  if (explicitProvider && explicitProvider !== 'auto') {
    return createSpecificProvider(explicitProvider, config);
  }

  // Auto-detect based on available credentials
  // Priority: Ollama (local) > Anthropic > OpenAI

  // Check Ollama first (privacy-first, no API key needed)
  if (process.env.OLLAMA_BASE_URL) {
    logger.info({ provider: 'ollama', baseUrl: process.env.OLLAMA_BASE_URL }, 'Using Ollama provider');
    return new OllamaProvider({
      baseUrl: config.baseUrl || process.env.OLLAMA_BASE_URL,
      defaultModel: config.model || process.env.OLLAMA_MODEL || 'llama3.2',
    });
  }

  // Check Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    logger.info({ provider: 'anthropic' }, 'Using Anthropic provider');
    return new AnthropicProvider({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      defaultModel: config.model || process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    });
  }

  // Check OpenAI
  if (process.env.OPENAI_API_KEY) {
    logger.info({ provider: 'openai' }, 'Using OpenAI provider');
    return new OpenAIProvider({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseUrl: config.baseUrl || process.env.OPENAI_BASE_URL,
      defaultModel: config.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    });
  }

  throw new Error(
    'No LLM provider configured. Set one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_BASE_URL'
  );
}

/**
 * Create a specific provider by name
 * @param {string} providerName
 * @param {LLMConfig} config
 * @returns {import('./types').BaseLLMProvider}
 */
function createSpecificProvider(providerName, config = {}) {
  switch (providerName.toLowerCase()) {
    case 'openai':
      const openaiKey = config.apiKey || process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY is required for OpenAI provider');
      }
      return new OpenAIProvider({
        apiKey: openaiKey,
        baseUrl: config.baseUrl || process.env.OPENAI_BASE_URL,
        defaultModel: config.model || process.env.OPENAI_MODEL,
      });

    case 'anthropic':
      const anthropicKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) {
        throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider');
      }
      return new AnthropicProvider({
        apiKey: anthropicKey,
        defaultModel: config.model || process.env.ANTHROPIC_MODEL,
      });

    case 'ollama':
      return new OllamaProvider({
        baseUrl: config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        defaultModel: config.model || process.env.OLLAMA_MODEL,
      });

    default:
      throw new Error(`Unknown LLM provider: ${providerName}`);
  }
}

/**
 * Get a singleton LLM provider instance
 * Cached for reuse across the application
 * @param {LLMConfig} [config] - Configuration (only used on first call)
 * @returns {import('./types').BaseLLMProvider}
 */
function getProvider(config) {
  if (!cachedProvider) {
    cachedProvider = createProvider(config);
  }
  return cachedProvider;
}

/**
 * Check if any LLM provider is configured
 * @returns {boolean}
 */
function isLLMConfigured() {
  return !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OLLAMA_BASE_URL
  );
}

/**
 * Get information about the configured provider
 * @returns {Object}
 */
function getProviderInfo() {
  if (process.env.LLM_PROVIDER) {
    return {
      provider: process.env.LLM_PROVIDER,
      source: 'explicit',
    };
  }

  if (process.env.OLLAMA_BASE_URL) {
    return {
      provider: 'ollama',
      source: 'auto-detected',
      baseUrl: process.env.OLLAMA_BASE_URL,
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      source: 'auto-detected',
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      source: 'auto-detected',
    };
  }

  return {
    provider: null,
    source: 'none',
  };
}

/**
 * Reset the cached provider (useful for testing)
 */
function resetProvider() {
  cachedProvider = null;
}

module.exports = {
  createProvider,
  createSpecificProvider,
  getProvider,
  isLLMConfigured,
  getProviderInfo,
  resetProvider,
};
