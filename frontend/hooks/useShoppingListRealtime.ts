import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signalRService, ShoppingListEvent } from '@/lib/realtime/signalr-service';
import { ShoppingListItemType } from '@/hooks/queries/useShoppingListItems';
import { useHouseholdStore } from '@/stores/household.store';

export function useShoppingListRealtime(listId: string) {
  const queryClient = useQueryClient();
  const activeHouseholdId = useHouseholdStore((state) => state.getActiveHouseholdId());

  useEffect(() => {
    if (!listId || !activeHouseholdId) return;

    // Handler for when items are added
    const handleItemAdded = (event: ShoppingListEvent) => {
      if (event.shoppingListId !== listId) return;
      
      console.log('Shopping list item added:', event);
      
      // Update the cache with the new item
      queryClient.setQueryData(
        ['shopping-list-items', activeHouseholdId, listId],
        (oldData: ShoppingListItemType[] | undefined) => {
          if (!oldData) return [event.payload.item];
          
          // Check if item already exists (to avoid duplicates)
          const exists = oldData.some(item => item.id === event.payload.itemId);
          if (exists) return oldData;
          
          return [...oldData, event.payload.item];
        }
      );
    };

    // Handler for when items are updated
    const handleItemUpdated = (event: ShoppingListEvent) => {
      if (event.shoppingListId !== listId) return;
      
      console.log('Shopping list item updated:', event);
      
      // Update the cache with the updated item
      queryClient.setQueryData(
        ['shopping-list-items', activeHouseholdId, listId],
        (oldData: ShoppingListItemType[] | undefined) => {
          if (!oldData) return [];
          
          return oldData.map(item =>
            item.id === event.payload.itemId
              ? { ...item, ...event.payload.item }
              : item
          );
        }
      );
    };

    // Handler for when items are deleted
    const handleItemDeleted = (event: ShoppingListEvent) => {
      if (event.shoppingListId !== listId) return;
      
      console.log('Shopping list item deleted:', event);
      
      // Remove the item from the cache
      queryClient.setQueryData(
        ['shopping-list-items', activeHouseholdId, listId],
        (oldData: ShoppingListItemType[] | undefined) => {
          if (!oldData) return [];
          
          return oldData.filter(item => item.id !== event.payload.itemId);
        }
      );
    };

    // Subscribe to events
    signalRService.on('shoppinglist.item.added', handleItemAdded);
    signalRService.on('shoppinglist.item.updated', handleItemUpdated);
    signalRService.on('shoppinglist.item.deleted', handleItemDeleted);

    // Cleanup
    return () => {
      signalRService.off('shoppinglist.item.added', handleItemAdded);
      signalRService.off('shoppinglist.item.updated', handleItemUpdated);
      signalRService.off('shoppinglist.item.deleted', handleItemDeleted);
    };
  }, [listId, activeHouseholdId, queryClient]);
}