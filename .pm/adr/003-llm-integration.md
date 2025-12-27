# ADR-003: LLM Integration for Conversational Inventory Management

## Status
Proposed

## Date
2024-12-26

## Context

Manual inventory entry via web forms creates significant friction:
- Adding 15 items after grocery shopping takes 10+ minutes
- Users must context-switch between physical task and digital interface
- High friction leads to incomplete/abandoned inventory tracking

Conversational AI can transform this experience:
- Natural language while putting groceries away
- Voice input via existing Telegram bot or PWA
- Context-aware understanding ("used the rest of the milk")

## Decision

### 1. Provider-Agnostic LLM Interface

We will implement a unified LLM interface supporting multiple providers from day one:

```typescript
// backend/lib/llm/types.ts

interface LLMProvider {
  name: 'openai' | 'anthropic' | 'ollama' | 'custom';

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  // Streaming support for real-time responses
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatChunk>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string;           // Provider-specific model ID
  temperature?: number;     // 0-1, default 0.3 for structured tasks
  maxTokens?: number;
  tools?: ToolDefinition[]; // Function calling support
}

interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
```

### 2. Supported Providers

#### OpenAI
```typescript
// backend/lib/llm/providers/openai.ts

class OpenAIProvider implements LLMProvider {
  name = 'openai' as const;

  constructor(config: {
    apiKey: string;
    baseUrl?: string;      // For Azure OpenAI or proxies
    defaultModel?: string; // Default: gpt-4o-mini
  });
}
```

#### Anthropic
```typescript
// backend/lib/llm/providers/anthropic.ts

class AnthropicProvider implements LLMProvider {
  name = 'anthropic' as const;

  constructor(config: {
    apiKey: string;
    defaultModel?: string; // Default: claude-3-haiku
  });
}
```

#### Ollama (Self-Hosted)
```typescript
// backend/lib/llm/providers/ollama.ts

class OllamaProvider implements LLMProvider {
  name = 'ollama' as const;

  constructor(config: {
    baseUrl: string;       // Default: http://localhost:11434
    defaultModel?: string; // Default: llama3.2
  });
}
```

#### Custom OpenAI-Compatible
```typescript
// backend/lib/llm/providers/openai-compatible.ts

class OpenAICompatibleProvider implements LLMProvider {
  name = 'custom' as const;

  // Works with: vLLM, LocalAI, Together.ai, Groq, etc.
  constructor(config: {
    baseUrl: string;
    apiKey?: string;
    defaultModel: string;
  });
}
```

### 3. Provider Selection Strategy

```typescript
// backend/lib/llm/provider-factory.ts

class LLMProviderFactory {
  static create(config: LLMConfig): LLMProvider {
    // Priority: explicit config > env vars > fallback

    if (config.provider === 'ollama' || process.env.OLLAMA_BASE_URL) {
      return new OllamaProvider({ ... });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      return new AnthropicProvider({ ... });
    }

    if (process.env.OPENAI_API_KEY) {
      return new OpenAIProvider({ ... });
    }

    throw new Error('No LLM provider configured');
  }
}
```

Environment variables:
```bash
# Choose your provider (only one needed)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://localhost:11434

# Optional: Override defaults
LLM_PROVIDER=anthropic          # Force specific provider
LLM_MODEL=claude-3-5-sonnet     # Override default model
```

### 4. Inventory Intent Processing

```typescript
// backend/lib/llm/inventory-processor.ts

interface InventoryIntent {
  action: 'add' | 'consume' | 'waste' | 'query' | 'unknown';
  items: ParsedItem[];
  confidence: number;
}

interface ParsedItem {
  name: string;
  quantity?: number;
  unit?: string;
  location?: 'fridge' | 'freezer' | 'pantry';
  expirationDays?: number;  // Inferred from item type
  category?: string;
}

class InventoryIntentProcessor {
  constructor(private llm: LLMProvider) {}

  async process(
    userMessage: string,
    context: HouseholdContext
  ): Promise<InventoryIntent> {

    const systemPrompt = this.buildSystemPrompt(context);

    const response = await this.llm.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.2,  // Low for structured extraction
      tools: [inventoryTools],
    });

    return this.parseResponse(response);
  }

  private buildSystemPrompt(context: HouseholdContext): string {
    return `You are Pantrybot, a kitchen inventory assistant.

Current inventory summary:
${context.inventorySummary}

Your task: Parse the user's message about groceries/food and extract:
1. Action: add (bought/got), consume (used/ate), waste (expired/threw out), or query
2. Items with quantities, units, and inferred storage location
3. Infer reasonable expiration times based on item type

Be concise. Use the provided tools to structure your response.`;
  }
}
```

### 5. Tool/Function Definitions

```typescript
const inventoryTools: ToolDefinition[] = [
  {
    name: 'add_items',
    description: 'Add new items to household inventory',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string' },
              location: {
                type: 'string',
                enum: ['fridge', 'freezer', 'pantry']
              },
              expirationDays: { type: 'number' },
              category: { type: 'string' }
            },
            required: ['name']
          }
        }
      }
    }
  },
  {
    name: 'consume_items',
    description: 'Mark items as consumed/used',
    parameters: { ... }
  },
  {
    name: 'waste_items',
    description: 'Mark items as wasted/expired',
    parameters: { ... }
  },
  {
    name: 'query_inventory',
    description: 'Answer questions about current inventory',
    parameters: { ... }
  }
];
```

### 6. Integration Points

#### Telegram Bot Enhancement
```typescript
// backend/telegram/handlers/message.ts

async function handleMessage(msg: TelegramMessage) {
  const processor = new InventoryIntentProcessor(llmProvider);
  const context = await getHouseholdContext(msg.from.id);

  const intent = await processor.process(msg.text, context);

  switch (intent.action) {
    case 'add':
      const added = await inventoryService.addItems(intent.items);
      return `Added ${added.length} items to your inventory!`;

    case 'consume':
      await inventoryService.consumeItems(intent.items);
      return `Marked as used. Enjoy your meal!`;

    case 'query':
      return intent.response;
  }
}
```

#### Voice Input (PWA)
```typescript
// frontend/hooks/useVoiceInput.ts

export function useVoiceInput() {
  const recognition = useSpeechRecognition();

  const processVoice = async (transcript: string) => {
    const response = await api.llm.process({
      message: transcript,
      householdId: currentHouseholdId,
    });

    // Show confirmation UI with parsed items
    return response;
  };

  return { startListening, stopListening, processVoice };
}
```

### 7. Context Management

To keep LLM context efficient and costs low:

```typescript
interface HouseholdContext {
  // Compact inventory summary (not full item list)
  inventorySummary: string;  // "15 items: 5 dairy, 4 produce, 3 meat..."

  // Recent items for disambiguation
  recentItems: string[];     // Last 10 items added/consumed

  // User preferences
  preferences: {
    defaultLocation: string;
    dietaryRestrictions: string[];
  };
}

function buildInventorySummary(items: InventoryItem[]): string {
  // Compress to ~200 tokens max
  const byCategory = groupBy(items, 'category');
  const expiringSoon = items.filter(i => i.daysUntilExpiration <= 3);

  return `
Inventory: ${items.length} items
Categories: ${Object.entries(byCategory).map(([k,v]) => `${k}(${v.length})`).join(', ')}
Expiring soon: ${expiringSoon.map(i => i.name).join(', ')}
  `.trim();
}
```

### 8. Cost Management

```typescript
// backend/lib/llm/cost-tracker.ts

interface UsageTracker {
  trackUsage(householdId: string, usage: TokenUsage): void;
  getMonthlyUsage(householdId: string): Promise<MonthlyUsage>;
  isWithinLimits(householdId: string): Promise<boolean>;
}

// Rate limiting per household
const MONTHLY_LIMITS = {
  free: { inputTokens: 50_000, outputTokens: 10_000 },
  premium: { inputTokens: 500_000, outputTokens: 100_000 },
};

// Caching for repeated queries
const responseCache = new LRUCache<string, CachedResponse>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour
});
```

### 9. Recipe Integration

```typescript
// backend/lib/recipes/recipe-service.ts

interface RecipeService {
  findByIngredients(
    ingredients: string[],
    options?: RecipeOptions
  ): Promise<Recipe[]>;

  suggestForExpiring(
    expiringItems: InventoryItem[]
  ): Promise<RecipeSuggestion[]>;
}

// Primary: Spoonacular API
class SpoonacularRecipeService implements RecipeService {
  async findByIngredients(ingredients: string[]) {
    const response = await fetch(
      `https://api.spoonacular.com/recipes/findByIngredients?` +
      `ingredients=${ingredients.join(',')}&number=5&ranking=2`
    );
    return this.transformRecipes(await response.json());
  }
}

// Fallback: LLM-generated recipes
class LLMRecipeService implements RecipeService {
  async findByIngredients(ingredients: string[]) {
    const response = await this.llm.chat([
      { role: 'system', content: 'Generate 3 simple recipes...' },
      { role: 'user', content: `Ingredients: ${ingredients.join(', ')}` }
    ]);
    return this.parseRecipes(response.content);
  }
}
```

## Consequences

### Positive
- Users can manage inventory conversationally while doing physical tasks
- Provider flexibility prevents vendor lock-in
- Self-hosted option (Ollama) for privacy-conscious users
- Recipe integration adds immediate value to inventory data

### Negative
- LLM costs scale with usage (mitigated by caching, limits)
- Requires API keys or local Ollama setup
- Voice recognition accuracy varies by accent/environment

### Neutral
- Adds complexity to backend architecture
- Requires monitoring of LLM performance and costs

## Implementation Phases

### Phase 1: Foundation (Week 1-2) - COMPLETED
- [x] Implement LLMProvider interface
- [x] Add OpenAI, Anthropic, and Ollama providers
- [x] Create InventoryIntentProcessor
- [x] Add environment variable configuration
- [x] Add LLM API routes (/api/v1/llm/*)

### Phase 2: Telegram Integration (Week 2-3) - COMPLETED
- [x] Enhance Telegram bot with LLM processing
- [x] Add conversation context management
- [x] Implement account linking flows
- [x] Add chat UI component with suggestions

### Phase 3: Recipe Integration (Week 3-4) - COMPLETED
- [x] Integrate Spoonacular API (with LLM fallback)
- [x] Add "What can I make?" query handler (suggest_recipes tool)
- [x] Create recipe suggestion notifications
- [x] Add recipe routes (/api/v1/recipes/*)
- [x] Create RecipeCard and RecipeSuggestions components

### Phase 4: Voice Input (Week 4-5) - NOT STARTED
- [ ] Add Web Speech API integration to PWA
- [ ] Create voice input UI component
- [ ] Implement real-time transcription display

## References

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Spoonacular API](https://spoonacular.com/food-api/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
