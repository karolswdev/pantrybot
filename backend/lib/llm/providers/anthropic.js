/**
 * Anthropic Provider
 *
 * Supports Claude models via the Anthropic API
 */

const { BaseLLMProvider } = require('../types');
const { logger } = require('../../logger');

const DEFAULT_MODEL = 'claude-3-haiku-20240307';
const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_TIMEOUT = 30000;
const API_VERSION = '2023-06-01';

class AnthropicProvider extends BaseLLMProvider {
  /**
   * @param {Object} config
   * @param {string} config.apiKey - Anthropic API key
   * @param {string} [config.baseUrl] - API base URL
   * @param {string} [config.defaultModel] - Default model to use
   * @param {number} [config.timeout] - Request timeout in ms
   */
  constructor(config) {
    super('anthropic', config);

    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
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

    // Anthropic requires system message to be separate
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    const requestBody = {
      model,
      messages: conversationMessages,
      temperature,
      max_tokens: options.maxTokens || 4096,
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    // Add tools if provided
    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));

      if (options.toolChoice) {
        if (options.toolChoice === 'auto') {
          requestBody.tool_choice = { type: 'auto' };
        } else if (options.toolChoice === 'none') {
          // Anthropic doesn't have 'none', just don't send tools
          delete requestBody.tools;
        } else {
          requestBody.tool_choice = {
            type: 'tool',
            name: options.toolChoice,
          };
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        logger.error({ status: response.status, error }, 'Anthropic API error');
        throw new Error(`Anthropic API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      // Extract text content and tool uses
      let textContent = '';
      const toolCalls = [];

      for (const block of data.content) {
        if (block.type === 'text') {
          textContent += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input,
          });
        }
      }

      return {
        content: textContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        finishReason: data.stop_reason,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Anthropic request timed out after ${this.timeout}ms`);
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

    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    const requestBody = {
      model,
      messages: conversationMessages,
      temperature,
      max_tokens: options.maxTokens || 4096,
      stream: true,
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
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

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content_block_delta') {
                const delta = parsed.delta?.text || '';
                if (delta) {
                  yield { content: delta, done: false };
                }
              } else if (parsed.type === 'message_stop') {
                yield { content: '', done: true };
                return;
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
      // Anthropic doesn't have a simple health check endpoint
      // We'll do a minimal request to verify the API key
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

module.exports = { AnthropicProvider };
