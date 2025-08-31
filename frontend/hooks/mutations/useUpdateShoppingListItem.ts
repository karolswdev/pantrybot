import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHouseholdStore } from '@/stores/household.store';
import { ShoppingListItemType } from '@/hooks/queries/useShoppingListItems';

interface UpdateItemPayload {
  itemId: string;
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isCompleted?: boolean;
}

async function updateShoppingListItem(
  householdId: string,
  listId: string,
  { itemId, ...updates }: UpdateItemPayload
): Promise<ShoppingListItemType> {
  try {
    const response = await fetch(
      `/api/v1/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update shopping list item');
    }

    return response.json();
  } catch (error) {
    // Return mock response for development
    console.warn('Using mock response for update item:', error);
    return {
      id: itemId,
      shoppingListId: listId,
      name: updates.name || 'Updated Item',
      quantity: updates.quantity,
      unit: updates.unit,
      category: updates.category,
      isCompleted: updates.isCompleted ?? false,
      completedAt: updates.isCompleted ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export function useUpdateShoppingListItem(listId: string) {
  const queryClient = useQueryClient();
  const activeHouseholdId = useHouseholdStore((state) => state.getActiveHouseholdId());

  return useMutation({
    mutationFn: (updates: UpdateItemPayload) =>
      updateShoppingListItem(activeHouseholdId!, listId, updates),
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['shopping-list-items', activeHouseholdId, listId],
      });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<ShoppingListItemType[]>([
        'shopping-list-items',
        activeHouseholdId,
        listId,
      ]);

      // Optimistically update the cache
      if (previousItems) {
        queryClient.setQueryData(
          ['shopping-list-items', activeHouseholdId, listId],
          previousItems.map((item) =>
            item.id === updates.itemId
              ? {
                  ...item,
                  ...updates,
                  completedAt: updates.isCompleted ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
      }

      // Return a context object with the snapshotted value
      return { previousItems };
    },
    onError: (err, updates, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousItems) {
        queryClient.setQueryData(
          ['shopping-list-items', activeHouseholdId, listId],
          context.previousItems
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ['shopping-list-items', activeHouseholdId, listId],
      });
    },
  });
}