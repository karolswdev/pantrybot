import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Check LLM availability
export interface LLMStatus {
  available: boolean;
  configured: boolean;
  provider?: string;
  source?: string;
  message?: string;
  hint?: string;
}

export function useLLMStatus() {
  return useQuery({
    queryKey: ['llm', 'status'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/llm/status');
      return response.data as LLMStatus;
    },
    staleTime: 60000, // 1 minute
    retry: false,
  });
}

// Process a natural language message
export interface ProcessMessagePayload {
  message: string;
  householdId: string;
  executeActions?: boolean;
}

export interface ParsedItem {
  name: string;
  quantity?: number;
  unit?: string;
  location?: 'fridge' | 'freezer' | 'pantry';
  expirationDays?: number;
  category?: string;
}

export interface InventoryIntent {
  action: 'add' | 'consume' | 'waste' | 'query' | 'unknown';
  items: ParsedItem[];
  response?: string;
  confidence: number;
  queryType?: string;
  filter?: string;
}

export interface ProcessMessageResponse {
  intent: InventoryIntent;
  executed: boolean;
  result?: {
    action: string;
    itemsProcessed: number;
    errors: Array<{ item: string; error: string }>;
  };
}

export function useProcessMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProcessMessagePayload) => {
      const response = await apiClient.post('/api/v1/llm/process', payload);
      return response.data as ProcessMessageResponse;
    },
    onSuccess: (data) => {
      // If actions were executed, invalidate inventory queries
      if (data.executed && data.result && data.result.itemsProcessed > 0) {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}

// Simple chat without executing actions (for testing/preview)
export interface ChatPayload {
  message: string;
  householdId?: string;
}

export interface ChatResponse {
  message: string;
  intent: InventoryIntent;
  response: string;
}

export function useLLMChat() {
  return useMutation({
    mutationFn: async (payload: ChatPayload) => {
      const response = await apiClient.post('/api/v1/llm/chat', payload);
      return response.data as ChatResponse;
    },
  });
}
