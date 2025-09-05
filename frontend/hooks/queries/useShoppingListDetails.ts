import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@/stores/household.store';
import { apiClient } from '@/lib/api-client';

export interface ShoppingListDetails {
  id: string;
  householdId: string;
  name: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  lastUpdated: string;
  estimatedTotal?: number;
  items: Array<Record<string, unknown>>;
}

async function fetchShoppingListDetails(householdId: string, listId: string): Promise<ShoppingListDetails> {
  const response = await apiClient.get(
    `/households/${householdId}/shopping-lists/${listId}`
  );
  
  return response.data;
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