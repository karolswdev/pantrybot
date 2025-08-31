import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ShoppingList {
  id: string;
  name: string;
  itemCount: number;
  completedCount: number;
  createdAt: string;
  createdBy: string;
  lastUpdated: string;
}

interface ShoppingListsResponse {
  lists: ShoppingList[];
  total: number;
}

// Mock data for development
const MOCK_SHOPPING_LISTS: ShoppingListsResponse = {
  lists: [
    {
      id: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Weekly Groceries',
      itemCount: 12,
      completedCount: 3,
      createdAt: '2024-01-14T00:00:00Z',
      createdBy: 'John Doe',
      lastUpdated: '2024-01-15T00:00:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440009',
      name: 'Party Supplies',
      itemCount: 5,
      completedCount: 0,
      createdAt: '2024-01-15T00:00:00Z',
      createdBy: 'Jane Smith',
      lastUpdated: '2024-01-15T00:00:00Z',
    },
  ],
  total: 2,
};

export function useShoppingLists(householdId: string) {
  return useQuery<ShoppingListsResponse>({
    queryKey: ['shopping-lists', householdId],
    queryFn: async () => {
      if (!householdId) {
        throw new Error('Household ID is required');
      }

      try {
        const response = await apiClient.get(
          `/households/${householdId}/shopping-lists`
        );
        return response.data;
      } catch (error) {
        // Fallback to mock data when API is unavailable
        console.warn('API unavailable, using mock shopping lists data');
        return MOCK_SHOPPING_LISTS;
      }
    },
    enabled: !!householdId,
    retry: false, // Don't retry when backend is down
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}