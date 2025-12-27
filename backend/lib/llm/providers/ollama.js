/**
 * Ollama Provider
 *
 * Supports self-hosted models via Ollama
 * Privacy-first option - all data stays local
 */

const { BaseLLMProvider } = require('../types');
const { logger } = require('../../logger');

const DEFAULT_MODEL = 'llama3.2';
const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_TIMEOUT = 60000; // Longer timeout for local models

class OllamaProvider extends BaseLLMProvider {
  /**
   * @param {Object} config
   * @param {string} [config.baseUrl] - Ollama API base URL
   * @param {string} [config.apiKey] - API key for authenticated endpoints
   * @param {string} [config.defaultModel] - Default model to use
   * @param {number} [config.timeout] - Request timeout in ms
   */
  constructor(config = {}) {
    super('ollama', config);

    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.apiKey = config.apiKey || null;
    this.defaultModel = config.defaultModel || DEFAULT_MODEL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Get headers for API requests
   * @returns {Object}
   */
  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Send a chat completion request
   * @param {import('../types').ChatMessage[]} messages
   * @param {import('../types').ChatOptions} [options]
   * @returns {Promise<import('../types').ChatResponse>}
   */
  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.3;

    // Build the request body
    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      options: {
        temperature,
      },
    };

    // Ollama supports tools via the tools parameter (similar to OpenAI)
    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error }, 'Ollama API error');
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      // Parse tool calls if present
      let toolCalls;
      if (data.message?.tool_calls && Array.isArray(data.message.tool_calls)) {
        toolCalls = data.message.tool_calls.map((tc, index) => {
          // Arguments may be a string (JSON) or already an object
          let args = tc.function.arguments;
          if (typeof args === 'string') {
            try {
              args = JSON.parse(args);
            } catch (e) {
              logger.warn({ args }, 'Failed to parse tool arguments as JSON');
              args = {};
            }
          }
          return {
            id: `call_${index}`,
            name: tc.function.name,
            arguments: args,
          };
        });
      }

      return {
        content: data.message?.content || '',
        toolCalls,
        usage: {
          inputTokens: data.prompt_eval_count || 0,
          outputTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done_reason || 'stop',
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${this.timeout}ms`);
      }

      // Check if Ollama is not running
      if (error.cause?.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Ollama at ${this.baseUrl}. Is Ollama running?`);
      }

      throw error;
    }
  }

  /**
   * Send a streaming chat completion request
   * @param {import('../types').ChatMessage[]} messages
   * @param {import('../types').ChatOptions} [options]
   * @returns {AsyncIterable<import('../types').ChatChunk>}
   */
  async *chatStream(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.3;

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
      options: {
        temperature,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { content: '', done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line);

            if (parsed.done) {
              yield {
                content: '',
                done: true,
                usage: {
                  inputTokens: parsed.prompt_eval_count || 0,
                  outputTokens: parsed.eval_count || 0,
                },
              };
              return;
            }

            const content = parsed.message?.content || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Check if the provider is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: this._getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   * @returns {Promise<string[]>}
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: this._getHeaders(),
      });
      if (!response.ok) return [];

      const data = await response.json();
      return data.models?.map(m => m.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Pull a model if not already available
   * @param {string} modelName
   * @returns {Promise<boolean>}
   */
  async pullModel(modelName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({ name: modelName, stream: false }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

module.exports = { OllamaProvider };
