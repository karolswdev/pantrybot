/**
 * Tests for LLM Types
 */

const { BaseLLMProvider } = require('../../../lib/llm/types');

describe('BaseLLMProvider', () => {
  describe('constructor', () => {
    it('should set name and config', () => {
      const provider = new BaseLLMProvider('test-provider', { apiKey: 'test-key' });

      expect(provider.name).toBe('test-provider');
      expect(provider.config).toEqual({ apiKey: 'test-key' });
    });

    it('should set config to undefined when not provided', () => {
      const provider = new BaseLLMProvider('test-provider');

      expect(provider.config).toBeUndefined();
    });
  });

  describe('chat', () => {
    it('should throw error when not implemented', async () => {
      const provider = new BaseLLMProvider('test-provider', {});

      await expect(provider.chat([{ role: 'user', content: 'hello' }]))
        .rejects.toThrow('chat() must be implemented by provider');
    });
  });

  describe('chatStream', () => {
    it('should throw error when not implemented', async () => {
      const provider = new BaseLLMProvider('test-provider', {});
      const generator = provider.chatStream([{ role: 'user', content: 'hello' }]);

      await expect(generator.next())
        .rejects.toThrow('chatStream() must be implemented by provider');
    });
  });

  describe('isAvailable', () => {
    it('should return false by default', async () => {
      const provider = new BaseLLMProvider('test-provider', {});

      const result = await provider.isAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getDefaultModel', () => {
    it('should return configured default model', () => {
      const provider = new BaseLLMProvider('test-provider', {
        defaultModel: 'test-model',
      });

      expect(provider.getDefaultModel()).toBe('test-model');
    });

    it('should return unknown when no model configured', () => {
      const provider = new BaseLLMProvider('test-provider', {});

      expect(provider.getDefaultModel()).toBe('unknown');
    });
  });
});
