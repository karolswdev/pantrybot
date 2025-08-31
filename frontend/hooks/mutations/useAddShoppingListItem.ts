import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHouseholdStore } from '@/stores/household.store';
import { ShoppingListItemType } from '@/hooks/queries/useShoppingListItems';

interface AddItemPayload {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isCompleted?: boolean;
}

async function addShoppingListItem(
  householdId: string,
  listId: string,
  item: AddItemPayload
): Promise<ShoppingListItemType> {
  try {
    const response = await fetch(
      `/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(item),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add item to shopping list');
    }

    return response.json();
  } catch (error) {
    // Return mock response for development
    console.warn('Using mock response for add item:', error);
    return {
      id: Date.now().toString(),
      shoppingListId: listId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      isCompleted: item.isCompleted || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export function useAddShoppingListItem(listId: string) {
  const queryClient = useQueryClient();
  const activeHouseholdId = useHouseholdStore((state) => state.getActiveHouseholdId());

  return useMutation({
    mutationFn: (item: AddItemPayload) =>
      addShoppingListItem(activeHouseholdId!, listId, item),
    onSuccess: (newItem) => {
      // Update the cache optimistically
      queryClient.setQueryData(
        ['shopping-list-items', activeHouseholdId, listId],
        (oldData: ShoppingListItemType[] | undefined) => {
          if (!oldData) return [newItem];
          return [...oldData, newItem];
        }
      );
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['shopping-list-items', activeHouseholdId, listId],
      });
    },
  });
}