/**
 * Tests for Ollama Provider
 */

const { OllamaProvider } = require('../../../../lib/llm/providers/ollama');

// Mock global fetch
global.fetch = jest.fn();

describe('OllamaProvider', () => {
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OllamaProvider({
      baseUrl: 'http://localhost:11434',
      defaultModel: 'llama3.2',
    });
  });

  describe('constructor', () => {
    it('should set default configuration', () => {
      expect(provider.name).toBe('ollama');
      expect(provider.defaultModel).toBe('llama3.2');
      expect(provider.baseUrl).toBe('http://localhost:11434');
    });

    it('should use defaults when no config provided', () => {
      const defaultProvider = new OllamaProvider();
      expect(defaultProvider.baseUrl).toBe('http://localhost:11434');
      expect(defaultProvider.defaultModel).toBe('llama3.2');
    });

    it('should allow custom base URL', () => {
      const customProvider = new OllamaProvider({
        baseUrl: 'http://custom:11434',
      });
      expect(customProvider.baseUrl).toBe('http://custom:11434');
    });

    it('should allow custom timeout', () => {
      const customProvider = new OllamaProvider({
        timeout: 120000,
      });
      expect(customProvider.timeout).toBe(120000);
    });
  });

  describe('chat', () => {
    it('should make correct API request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: { content: 'Hello!' },
          prompt_eval_count: 10,
          eval_count: 5,
          done_reason: 'stop',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const messages = [{ role: 'user', content: 'Hi' }];
      const result = await provider.chat(messages);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          message: {
            content: '',
            tool_calls: [{
              function: {
                name: 'add_items',
                arguments: { items: [{ name: 'milk' }] },
              },
            }],
          },
          prompt_eval_count: 10,
          eval_count: 5,
          done_reason: 'tool_calls',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await provider.chat([{ role: 'user', content: 'Add milk' }]);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('add_items');
      expect(result.toolCalls[0].arguments).toEqual({ items: [{ name: 'milk' }] });
      expect(result.toolCalls[0].id).toBe('call_0');
    });

    it('should include tools in request when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: { content: 'OK' },
          prompt_eval_count: 10,
          eval_count: 5,
          done_reason: 'stop',
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
        status: 500,
        text: jest.fn().mockResolvedValue('Internal server error'),
      });

      await expect(provider.chat([{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow('Ollama API error: 500 - Internal server error');
    });

    it('should use custom model when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: { content: 'OK' },
          prompt_eval_count: 10,
          eval_count: 5,
          done_reason: 'stop',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.chat([{ role: 'user', content: 'Hi' }], { model: 'mistral' });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('mistral');
    });

    it('should set stream to false', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: { content: 'OK' },
          prompt_eval_count: 10,
          eval_count: 5,
          done_reason: 'stop',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.chat([{ role: 'user', content: 'Hi' }]);

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.stream).toBe(false);
    });

    it('should calculate usage correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: { content: 'Hello!' },
          prompt_eval_count: 10,
          eval_count: 5,
          done_reason: 'stop',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await provider.chat([{ role: 'user', content: 'Hi' }]);

      expect(result.usage.inputTokens).toBe(10);
      expect(result.usage.outputTokens).toBe(5);
      expect(result.usage.totalTokens).toBe(15);
    });

    it('should pass temperature in options', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          message: { content: 'OK' },
          prompt_eval_count: 10,
          eval_count: 5,
          done_reason: 'stop',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await provider.chat([{ role: 'user', content: 'Hi' }], { temperature: 0.8 });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.options.temperature).toBe(0.8);
    });
  });

  describe('isAvailable', () => {
    it('should return true on successful API call', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ models: [] }),
      });

      const result = await provider.isAvailable();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false on API error', async () => {
      global.fetch.mockRejectedValue(new Error('Connection refused'));

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });

    it('should return false on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('listModels', () => {
    it('should return list of model names', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          models: [
            { name: 'llama3.2' },
            { name: 'mistral' },
            { name: 'codellama' },
          ],
        }),
      });

      const result = await provider.listModels();

      expect(result).toEqual(['llama3.2', 'mistral', 'codellama']);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });

    it('should return empty array on error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.listModels();

      expect(result).toEqual([]);
    });

    it('should return empty array on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await provider.listModels();

      expect(result).toEqual([]);
    });
  });

  describe('pullModel', () => {
    it('should return true on successful pull', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
      });

      const result = await provider.pullModel('llama3.2');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/pull',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'llama3.2', stream: false }),
        })
      );
    });

    it('should return false on error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.pullModel('llama3.2');

      expect(result).toBe(false);
    });

    it('should return false on non-ok response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await provider.pullModel('nonexistent-model');

      expect(result).toBe(false);
    });
  });
});
