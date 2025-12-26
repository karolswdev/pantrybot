/**
 * OpenAI Provider
 *
 * Supports OpenAI API and any OpenAI-compatible endpoint (Azure, vLLM, Together, etc.)
 */

const { BaseLLMProvider } = require('../types');
const { logger } = require('../../logger');

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_TIMEOUT = 30000;

class OpenAIProvider extends BaseLLMProvider {
  /**
   * @param {Object} config
   * @param {string} config.apiKey - OpenAI API key
   * @param {string} [config.baseUrl] - API base URL (for Azure or compatible APIs)
   * @param {string} [config.defaultModel] - Default model to use
   * @param {number} [config.timeout] - Request timeout in ms
   */
  constructor(config) {
    super('openai', config);

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.defaultModel = config.defaultModel || DEFAULT_MODEL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
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

    const requestBody = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
    };

    if (options.maxTokens) {
      requestBody.max_tokens = options.maxTokens;
    }

    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      if (options.toolChoice) {
        if (options.toolChoice === 'auto' || options.toolChoice === 'none') {
          requestBody.tool_choice = options.toolChoice;
        } else {
          requestBody.tool_choice = {
            type: 'function',
            function: { name: options.toolChoice },
          };
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        logger.error({ status: response.status, error }, 'OpenAI API error');
        throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const choice = data.choices[0];

      return {
        content: choice.message.content || '',
        toolCalls: this._parseToolCalls(choice.message.tool_calls),
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`OpenAI request timed out after ${this.timeout}ms`);
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
      temperature,
      stream: true,
    };

    if (options.maxTokens) {
      requestBody.max_tokens = options.maxTokens;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
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
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              yield { content: '', done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta?.content || '';

              if (delta) {
                yield { content: delta, done: false };
              }
            } catch {
              // Skip malformed JSON
            }
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
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Parse tool calls from OpenAI response format
   * @private
   */
  _parseToolCalls(toolCalls) {
    if (!toolCalls || !Array.isArray(toolCalls)) {
      return undefined;
    }

    return toolCalls.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}'),
    }));
  }
}

module.exports = { OpenAIProvider };
