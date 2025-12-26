/**
 * LLM Provider Types and Interfaces
 *
 * Defines the contract for all LLM providers (OpenAI, Anthropic, Ollama, etc.)
 */

/**
 * @typedef {'openai' | 'anthropic' | 'ollama' | 'custom'} ProviderName
 */

/**
 * @typedef {'system' | 'user' | 'assistant'} MessageRole
 */

/**
 * @typedef {Object} ChatMessage
 * @property {MessageRole} role - The role of the message sender
 * @property {string} content - The message content
 */

/**
 * @typedef {Object} ToolParameter
 * @property {string} type - Parameter type (string, number, array, object)
 * @property {string} [description] - Parameter description
 * @property {string[]} [enum] - Allowed values for enum types
 * @property {Object} [items] - Schema for array items
 * @property {Object} [properties] - Schema for object properties
 * @property {string[]} [required] - Required properties for objects
 */

/**
 * @typedef {Object} ToolDefinition
 * @property {string} name - Tool/function name
 * @property {string} description - What the tool does
 * @property {Object} parameters - JSON Schema for parameters
 * @property {string} parameters.type - Always 'object'
 * @property {Object.<string, ToolParameter>} parameters.properties - Parameter definitions
 * @property {string[]} [parameters.required] - Required parameter names
 */

/**
 * @typedef {Object} ToolCall
 * @property {string} id - Unique identifier for this tool call
 * @property {string} name - Name of the tool being called
 * @property {Object} arguments - Parsed arguments for the tool
 */

/**
 * @typedef {Object} ChatOptions
 * @property {string} [model] - Provider-specific model ID
 * @property {number} [temperature=0.3] - Randomness (0-1)
 * @property {number} [maxTokens] - Maximum tokens in response
 * @property {ToolDefinition[]} [tools] - Available tools/functions
 * @property {string} [toolChoice] - 'auto', 'none', or specific tool name
 */

/**
 * @typedef {Object} TokenUsage
 * @property {number} inputTokens - Tokens in the prompt
 * @property {number} outputTokens - Tokens in the response
 * @property {number} [totalTokens] - Total tokens used
 */

/**
 * @typedef {Object} ChatResponse
 * @property {string} content - The assistant's response text
 * @property {ToolCall[]} [toolCalls] - Tool calls requested by the model
 * @property {TokenUsage} usage - Token usage statistics
 * @property {string} [finishReason] - Why the response ended
 */

/**
 * @typedef {Object} ChatChunk
 * @property {string} content - Partial content for streaming
 * @property {boolean} done - Whether this is the final chunk
 * @property {TokenUsage} [usage] - Usage stats (only on final chunk)
 */

/**
 * @typedef {Object} LLMProviderConfig
 * @property {string} [apiKey] - API key for the provider
 * @property {string} [baseUrl] - Base URL for API requests
 * @property {string} [defaultModel] - Default model to use
 * @property {number} [timeout=30000] - Request timeout in ms
 */

/**
 * Base class for LLM providers
 * @abstract
 */
class BaseLLMProvider {
  /**
   * @param {ProviderName} name - Provider identifier
   * @param {LLMProviderConfig} config - Provider configuration
   */
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  /**
   * Send a chat completion request
   * @abstract
   * @param {ChatMessage[]} messages - Conversation messages
   * @param {ChatOptions} [options] - Request options
   * @returns {Promise<ChatResponse>} The model's response
   */
  async chat(messages, options = {}) {
    throw new Error('chat() must be implemented by provider');
  }

  /**
   * Send a streaming chat completion request
   * @abstract
   * @param {ChatMessage[]} messages - Conversation messages
   * @param {ChatOptions} [options] - Request options
   * @returns {AsyncIterable<ChatChunk>} Stream of response chunks
   */
  async *chatStream(messages, options = {}) {
    throw new Error('chatStream() must be implemented by provider');
  }

  /**
   * Check if the provider is properly configured and available
   * @returns {Promise<boolean>} Whether the provider is ready
   */
  async isAvailable() {
    return false;
  }

  /**
   * Get the default model for this provider
   * @returns {string} Model identifier
   */
  getDefaultModel() {
    return this.config.defaultModel || 'unknown';
  }
}

module.exports = {
  BaseLLMProvider,
};
