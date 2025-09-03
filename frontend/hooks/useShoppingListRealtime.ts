import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signalRService } from '@/lib/realtime/signalr-service';
import { ShoppingListItemType } from '@/hooks/queries/useShoppingListItems';
import { useHouseholdStore } from '@/stores/household.store';

export function useShoppingListRealtime(listId: string) {
  const queryClient = useQueryClient();
  const activeHouseholdId = useHouseholdStore((state) => state.getActiveHouseholdId());

  useEffect(() => {
    if (!listId || !activeHouseholdId) return;

    // Handler for when items are added
    const handleItemAdded = (event: any) => {
      // Check if event is for this list
      if (event.listId !== listId) return;
      
      console.log('Shopping list item added:', event);
      
      // Transform the event item to match frontend type
      const newItem: ShoppingListItemType = {
        id: event.item.id,
        shoppingListId: listId,
        name: event.item.name,
        quantity: event.item.quantity,
        unit: event.item.unit,
        category: event.item.category,
        notes: event.item.notes,
        isCompleted: event.item.completed || false,
        completedAt: event.item.completedAt,
        createdAt: event.item.addedAt,
        updatedAt: event.item.updatedAt || event.item.addedAt,
      };
      
      // Update the cache with the new item
      queryClient.setQueryData(
        ['shopping-list-items', activeHouseholdId, listId],
        (oldData: ShoppingListItemType[] | undefined) => {
          if (!oldData) return [newItem];
          
          // Check if item already exists (to avoid duplicates)
          const exists = oldData.some(item => item.id === newItem.id);
          if (exists) return oldData;
          
          return [...oldData, newItem];
        }
      );
    };

    // Handler for when items are updated
    const handleItemUpdated = (event: any) => {
      // Check if event is for this list
      if (event.listId !== listId) return;
      
      console.log('Shopping list item updated:', event);
      
      // Transform the event item to match frontend type
      const updatedItem: Partial<ShoppingListItemType> = {
        id: event.item.id,
        name: event.item.name,
        quantity: event.item.quantity,
        unit: event.item.unit,
        category: event.item.category,
        notes: event.item.notes,
        isCompleted: event.item.completed || false,
        completedAt: event.item.completedAt,
        updatedAt: event.item.updatedAt,
      };
      
      // Update the cache with the updated item
      queryClient.setQueryData(
        ['shopping-list-items', activeHouseholdId, listId],
        (oldData: ShoppingListItemType[] | undefined) => {
          if (!oldData) return [];
          
          return oldData.map(item =>
            item.id === updatedItem.id
              ? { ...item, ...updatedItem }
              : item
          );
        }
      );
    };

    // Handler for when items are deleted
    const handleItemDeleted = (event: any) => {
      // Check if event is for this list
      if (event.listId !== listId) return;
      
      console.log('Shopping list item deleted:', event);
      
      const deletedItemId = event.itemId || event.item?.id;
      
      // Remove the item from the cache
      queryClient.setQueryData(
        ['shopping-list-items', activeHouseholdId, listId],
        (oldData: ShoppingListItemType[] | undefined) => {
          if (!oldData) return [];
          
          return oldData.filter(item => item.id !== deletedItemId);
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