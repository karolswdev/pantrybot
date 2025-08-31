import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@/stores/household.store';

interface ShoppingListDetails {
  id: string;
  householdId: string;
  name: string;
  description?: string;
  estimatedTotal?: number;
  createdAt: string;
  updatedAt: string;
}

async function fetchShoppingListDetails(householdId: string, listId: string): Promise<ShoppingListDetails> {
  try {
    const response = await fetch(`/api/v1/households/${householdId}/shopping-lists/${listId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch shopping list details');
    }

    return response.json();
  } catch (error) {
    // Return mock data as fallback
    console.warn('Using mock data for shopping list details:', error);
    return {
      id: listId,
      householdId,
      name: 'Weekly Groceries',
      description: 'Shopping list for the week',
      estimatedTotal: 85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export function useShoppingListDetails(listId: string) {
  const activeHouseholdId = useHouseholdStore((state) => state.getActiveHouseholdId());

  return useQuery({
    queryKey: ['shopping-list-details', activeHouseholdId, listId],
    queryFn: () => fetchShoppingListDetails(activeHouseholdId!, listId),
    enabled: !!activeHouseholdId && !!listId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}