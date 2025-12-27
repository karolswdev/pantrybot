import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Recipe service status
export interface RecipeStatus {
  available: boolean;
  provider: 'spoonacular' | 'llm' | 'none';
}

export function useRecipeStatus() {
  return useQuery({
    queryKey: ['recipes', 'status'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/recipes/status');
      return response.data as RecipeStatus;
    },
    staleTime: 60000, // 1 minute
    retry: false,
  });
}

// Recipe suggestion types
export interface RecipeSuggestion {
  id: string | number;
  title: string;
  description?: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  usedIngredients: string[];
  missedIngredients?: string[];
  additionalIngredients?: string[];
  instructions?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  source: 'spoonacular' | 'llm';
}

export interface RecipeSuggestionsResponse {
  recipes: RecipeSuggestion[];
  provider: string;
  inventoryCount?: number;
  expiringCount?: number;
  expiringItems?: Array<{ name: string; expirationDate: string }>;
  message?: string;
}

// Get recipe suggestions for household inventory
export function useRecipeSuggestions(householdId: string | null, options?: {
  count?: number;
  prioritizeExpiring?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['recipes', 'suggestions', householdId, options?.count, options?.prioritizeExpiring],
    queryFn: async () => {
      if (!householdId) throw new Error('No household selected');

      const params = new URLSearchParams();
      if (options?.count) params.set('count', String(options.count));
      if (options?.prioritizeExpiring !== undefined) {
        params.set('prioritizeExpiring', String(options.prioritizeExpiring));
      }

      const response = await apiClient.get(
        `/api/v1/recipes/suggestions/${householdId}?${params.toString()}`
      );
      return response.data as RecipeSuggestionsResponse;
    },
    enabled: !!householdId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Get recipe suggestions specifically for expiring items
export function useExpiringRecipes(householdId: string | null, options?: {
  days?: number;
  count?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['recipes', 'expiring', householdId, options?.days, options?.count],
    queryFn: async () => {
      if (!householdId) throw new Error('No household selected');

      const params = new URLSearchParams();
      if (options?.days) params.set('days', String(options.days));
      if (options?.count) params.set('count', String(options.count));

      const response = await apiClient.get(
        `/api/v1/recipes/expiring/${householdId}?${params.toString()}`
      );
      return response.data as RecipeSuggestionsResponse;
    },
    enabled: !!householdId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Natural language recipe query
export interface RecipeQueryPayload {
  query: string;
  householdId: string;
}

export interface RecipeQueryResponse {
  response: string;
  recipes: RecipeSuggestion[];
}

export function useRecipeQuery() {
  return useMutation({
    mutationFn: async (payload: RecipeQueryPayload) => {
      const response = await apiClient.post('/api/v1/recipes/query', payload);
      return response.data as RecipeQueryResponse;
    },
  });
}

// Get detailed recipe info (Spoonacular only)
export interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  extendedIngredients: Array<{
    name: string;
    amount: number;
    unit: string;
    original: string;
  }>;
  instructions: string;
  analyzedInstructions: unknown[];
}

export function useRecipeDetails(recipeId: string | null) {
  return useQuery({
    queryKey: ['recipes', 'details', recipeId],
    queryFn: async () => {
      if (!recipeId) throw new Error('No recipe ID');

      const response = await apiClient.get(`/api/v1/recipes/${recipeId}`);
      return response.data as RecipeDetails;
    },
    enabled: !!recipeId && !recipeId.startsWith('llm-'),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
