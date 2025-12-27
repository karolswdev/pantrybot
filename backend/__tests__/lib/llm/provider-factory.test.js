/**
 * Tests for LLM Provider Factory
 */

const {
  createProvider,
  createSpecificProvider,
  getProvider,
  isLLMConfigured,
  getProviderInfo,
  resetProvider,
} = require('../../../lib/llm/provider-factory');
const { OpenAIProvider } = require('../../../lib/llm/providers/openai');
const { AnthropicProvider } = require('../../../lib/llm/providers/anthropic');
const { OllamaProvider } = require('../../../lib/llm/providers/ollama');

describe('Provider Factory', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment and cached provider before each test
    resetProvider();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.LLM_PROVIDER;
    delete process.env.OPENAI_MODEL;
    delete process.env.ANTHROPIC_MODEL;
    delete process.env.OLLAMA_MODEL;
  });

  afterAll(() => {
    // Restore original env vars
    process.env = originalEnv;
  });

  describe('isLLMConfigured', () => {
    it('should return false when no provider is configured', () => {
      expect(isLLMConfigured()).toBe(false);
    });

    it('should return true when OPENAI_API_KEY is set', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      expect(isLLMConfigured()).toBe(true);
    });

    it('should return true when ANTHROPIC_API_KEY is set', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      expect(isLLMConfigured()).toBe(true);
    });

    it('should return true when OLLAMA_BASE_URL is set', () => {
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      expect(isLLMConfigured()).toBe(true);
    });
  });

  describe('getProviderInfo', () => {
    it('should return none when no provider is configured', () => {
      const info = getProviderInfo();
      expect(info).toEqual({ provider: null, source: 'none' });
    });

    it('should return explicit provider when LLM_PROVIDER is set', () => {
      process.env.LLM_PROVIDER = 'openai';
      const info = getProviderInfo();
      expect(info).toEqual({ provider: 'openai', source: 'explicit' });
    });

    it('should auto-detect Ollama first', () => {
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      process.env.OPENAI_API_KEY = 'test-key';
      const info = getProviderInfo();
      expect(info.provider).toBe('ollama');
      expect(info.source).toBe('auto-detected');
    });

    it('should auto-detect Anthropic second', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'test-key';
      const info = getProviderInfo();
      expect(info.provider).toBe('anthropic');
      expect(info.source).toBe('auto-detected');
    });

    it('should auto-detect OpenAI last', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const info = getProviderInfo();
      expect(info.provider).toBe('openai');
      expect(info.source).toBe('auto-detected');
    });
  });

  describe('createSpecificProvider', () => {
    it('should create OpenAI provider', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const provider = createSpecificProvider('openai');
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should create Anthropic provider', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const provider = createSpecificProvider('anthropic');
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should create Ollama provider', () => {
      const provider = createSpecificProvider('ollama');
      expect(provider).toBeInstanceOf(OllamaProvider);
    });

    it('should throw for OpenAI without API key', () => {
      expect(() => createSpecificProvider('openai'))
        .toThrow('OPENAI_API_KEY is required');
    });

    it('should throw for Anthropic without API key', () => {
      expect(() => createSpecificProvider('anthropic'))
        .toThrow('ANTHROPIC_API_KEY is required');
    });

    it('should throw for unknown provider', () => {
      expect(() => createSpecificProvider('unknown'))
        .toThrow('Unknown LLM provider: unknown');
    });

    it('should use config overrides', () => {
      const provider = createSpecificProvider('ollama', {
        baseUrl: 'http://custom:11434',
        model: 'custom-model',
      });
      expect(provider.config.baseUrl).toBe('http://custom:11434');
    });
  });

  describe('createProvider', () => {
    it('should throw when no provider is configured', () => {
      expect(() => createProvider())
        .toThrow('No LLM provider configured');
    });

    it('should create provider from explicit LLM_PROVIDER', () => {
      process.env.LLM_PROVIDER = 'ollama';
      const provider = createProvider();
      expect(provider).toBeInstanceOf(OllamaProvider);
    });

    it('should auto-detect Ollama provider', () => {
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
      const provider = createProvider();
      expect(provider).toBeInstanceOf(OllamaProvider);
    });

    it('should auto-detect Anthropic provider', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const provider = createProvider();
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should auto-detect OpenAI provider', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      const provider = createProvider();
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });
  });

  describe('getProvider', () => {
    it('should return cached provider on subsequent calls', () => {
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';

      const provider1 = getProvider();
      const provider2 = getProvider();

      expect(provider1).toBe(provider2);
    });

    it('should create new provider after reset', () => {
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';

      const provider1 = getProvider();
      resetProvider();
      const provider2 = getProvider();

      expect(provider1).not.toBe(provider2);
    });
  });

  describe('resetProvider', () => {
    it('should clear cached provider', () => {
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';

      const provider1 = getProvider();
      resetProvider();

      // After reset, getProvider creates a new instance
      const provider2 = getProvider();
      expect(provider1).not.toBe(provider2);
    });
  });
});
