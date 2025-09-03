import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHouseholdStore } from '@/stores/household.store';
import { ShoppingListItemType } from '@/hooks/queries/useShoppingListItems';
import { apiClient } from '@/lib/api-client';

interface AddItemPayload {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  notes?: string;
}

async function addShoppingListItem(
  householdId: string,
  listId: string,
  item: AddItemPayload
): Promise<ShoppingListItemType> {
  const response = await apiClient.post(
    `/households/${householdId}/shopping-lists/${listId}/items`,
    item
  );
  
  // Transform backend response to match frontend type
  const data = response.data;
  return {
    id: data.id,
    shoppingListId: listId,
    name: data.name,
    quantity: data.quantity,
    unit: data.unit,
    category: data.category,
    notes: data.notes,
    isCompleted: data.completed || false,
    completedAt: data.completedAt,
    createdAt: data.addedAt || data.createdAt,
    updatedAt: data.updatedAt || data.addedAt,
  };
}

export function useAddShoppingListItem(listId: string) {
  const queryClient = useQueryClient();
  const activeHouseholdId = useHouseholdStore((state) => state.getActiveHouseholdId());

  return useMutation({
    mutationFn: (item: AddItemPayload) =>
      addShoppingListItem(activeHouseholdId!, listId, item),
    onSuccess: (newItem) => {
      // Immediately invalidate to force refetch
      queryClient.invalidateQueries({
        queryKey: ['shopping-list-items', activeHouseholdId, listId],
      });
      
      // Also invalidate the list details in case it's cached
      queryClient.invalidateQueries({
        queryKey: ['shopping-list-details', listId],
      });
    },
  });
}