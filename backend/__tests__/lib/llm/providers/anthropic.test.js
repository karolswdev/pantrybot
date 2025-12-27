/**
 * Tests for Anthropic Provider
 */

const { AnthropicProvider } = require('../../../../lib/llm/providers/anthropic');

// Mock global fetch
global.fetch = jest.fn();

describe('AnthropicProvider', () => {
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new AnthropicProvider({
      apiKey: 'test-api-key',
      defaultModel: 'claude-3-haiku-20240307',
    });
  });

  describe('constructor', () => {
    it('should set default configuration', () => {
      expect(provider.name).toBe('anthropic');
      expect(provider.apiKey).toBe('test-api-key');
      expect(provider.defaultModel).toBe('claude-3-haiku-20240307');
      expect(provider.baseUrl).toBe('https://api.anthropic.com');
    });

    it('should allow custom base URL', () => {
      const customProvider = new AnthropicProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
      });
      expect(customProvider.baseUrl).toBe('https://custom.api.com');
    });

    it('should throw error when API key is missing', () => {
      expect(() => new AnthropicProvider({}))
        .toThrow('Anthropic API key is required');
    });

    it('should use default model when not specified', () => {
      const defaultProvider = new AnthropicProvider({
        apiKey: 'test-key',
      });
      expect(defaultProvider.defaultModel).toBe('claude-3-haiku-20240307');
    });
  });

  describe('chat', () => {
    it('should make correct API request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Hello!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user', content: 'Hi' }];
      const result = await provider.chat(messages);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          },
        })
      );

      expect(result.content).toBe('Hello!');
      expect(result.finishReason).toBe('end_turn');
    });

    it('should handle system message separately', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'I am a helpful assistant.' }],
          usage: { input_tokens: 20, output_tokens: 10 },
          stop_reason: 'end_turn',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Who are you?' },
      ];
      await provider.chat(messages);

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are a helpful assistant.');
      expect(callBody.messages).toHaveLength(1);
      expect(callBody.messages[0].role).toBe('user');
    });

    it('should handle tool calls in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'tool_use',
              id: 'call_123',
              name: 'add_items',
              input: { items: [{ name: 'milk' }] },
            },
          ],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'tool_use',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await provider.chat([{ role: 'user', content: 'Add milk' }]);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('add_items');
      expect(result.toolCalls[0].arguments).toEqual({ items: [{ name: 'milk' }] });
    });

    it('should include tools in request when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'OK' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const tools = [{
        name: 'test_tool',
        description: 'A test tool',
        parameters: { type: 'object', properties: {} },
      }];

      await provider.chat([{ role: 'user', content: 'Hi' }], { tools });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.tools).toBeDefined();
      expect(callBody.tools[0].name).toBe('test_tool');
      expect(callBody.tools[0].input_schema).toEqual({ type: 'object', properties: {} });
    });

    it('should handle toolChoice auto', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'OK' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const tools = [{ name: 'test_tool', description: 'A test tool', parameters: {} }];
      await provider.chat([{ role: 'user', content: 'Hi' }], { tools, toolChoice: 'auto' });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.tool_choice).toEqual({ type: 'auto' });
    });

    it('should handle toolChoice none by removing tools', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'OK' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const tools = [{ name: 'test_tool', description: 'A test tool', parameters: {} }];
      await provider.chat([{ role: 'user', content: 'Hi' }], { tools, toolChoice: 'none' });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.tools).toBeUndefined();
    });

    it('should throw on API error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: { message: 'Invalid API key' } }),
      });

      await expect(provider.chat([{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow('Anthropic API error: 401 - Invalid API key');
    });

    it('should use custom model when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'OK' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.chat([{ role: 'user', content: 'Hi' }], { model: 'claude-3-opus-20240229' });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('claude-3-opus-20240229');
    });

    it('should calculate total tokens from usage', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Hello!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await provider.chat([{ role: 'user', content: 'Hi' }]);

      expect(result.usage.inputTokens).toBe(10);
      expect(result.usage.outputTokens).toBe(5);
      expect(result.usage.totalTokens).toBe(15);
    });
  });

  describe('isAvailable', () => {
    it('should return true on successful API call', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'hi' }],
          usage: {},
        }),
      });

      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false on API error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });

    it('should return false on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });
  });
});
