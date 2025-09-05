import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@/stores/household.store';
import { apiClient } from '@/lib/api-client';

export interface ShoppingListItemType {
  id: string;
  shoppingListId: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchShoppingListItems(householdId: string, listId: string): Promise<ShoppingListItemType[]> {
  const response = await apiClient.get(
    `/households/${householdId}/shopping-lists/${listId}/items`
  );
  
  // Transform backend response to match frontend type
  return response.data.map((item: {
    id: string;
    name: string;
    quantity: number;
    unit?: string;
    category?: string;
    notes?: string;
    completed?: boolean;
    completedAt?: string;
    addedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  }) => ({
    id: item.id,
    shoppingListId: listId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    notes: item.notes,
    isCompleted: item.completed || false,
    completedAt: item.completedAt,
    createdAt: item.addedAt || item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export function useShoppingListItems(listId: string) {
  const activeHouseholdId = useHouseholdStore((state) => state.getActiveHouseholdId());

  return useQuery({
    queryKey: ['shopping-list-items', activeHouseholdId, listId],
    queryFn: () => fetchShoppingListItems(activeHouseholdId!, listId),
    enabled: !!activeHouseholdId && !!listId,
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for real-time)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}