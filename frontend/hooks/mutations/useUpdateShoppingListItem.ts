import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHouseholdStore } from '@/stores/household.store';
import { ShoppingListItemType } from '@/hooks/queries/useShoppingListItems';
import { apiClient } from '@/lib/api-client';

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
  { itemId, isCompleted, ...updates }: UpdateItemPayload
): Promise<ShoppingListItemType> {
  // Transform isCompleted to completed for backend
  const backendPayload = {
    ...updates,
    completed: isCompleted,
  };
  
  const response = await apiClient.patch(
    `/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
    backendPayload
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
    updatedAt: data.updatedAt,
  };
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