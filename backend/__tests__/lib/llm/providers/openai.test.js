/**
 * Tests for OpenAI Provider
 */

const { OpenAIProvider } = require('../../../../lib/llm/providers/openai');

// Mock global fetch
global.fetch = jest.fn();

describe('OpenAIProvider', () => {
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider({
      apiKey: 'test-api-key',
      defaultModel: 'gpt-4o-mini',
    });
  });

  describe('constructor', () => {
    it('should set default configuration', () => {
      expect(provider.name).toBe('openai');
      expect(provider.apiKey).toBe('test-api-key');
      expect(provider.defaultModel).toBe('gpt-4o-mini');
      expect(provider.baseUrl).toBe('https://api.openai.com/v1');
    });

    it('should allow custom base URL', () => {
      const customProvider = new OpenAIProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
      });
      expect(customProvider.config.baseUrl).toBe('https://custom.api.com');
    });
  });

  describe('chat', () => {
    it('should make correct API request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: { content: 'Hello!' },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user', content: 'Hi' }];
      const result = await provider.chat(messages);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          },
        })
      );

      expect(result.content).toBe('Hello!');
      expect(result.finishReason).toBe('stop');
    });

    it('should handle tool calls in response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: null,
              tool_calls: [{
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'add_items',
                  arguments: '{"items":[{"name":"milk"}]}',
                },
              }],
            },
            finish_reason: 'tool_calls',
          }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
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
          choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
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
      expect(callBody.tools[0].function.name).toBe('test_tool');
    });

    it('should throw on API error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ error: { message: 'Invalid API key' } }),
      });

      await expect(provider.chat([{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow('OpenAI API error: 401 - Invalid API key');
    });

    it('should use custom model when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.chat([{ role: 'user', content: 'Hi' }], { model: 'gpt-4' });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('gpt-4');
    });
  });

  describe('isAvailable', () => {
    it('should return true on successful API call', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: [] }),
      });

      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false on API error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });
  });
});
