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
    const handleItemAdded = (event: unknown) => {
      // Check if event is for this list
      const typedEvent = event as { listId: string; item: Record<string, unknown> };
      if (typedEvent.listId !== listId) return;
      
      console.log('Shopping list item added:', typedEvent);
      
      // Transform the event item to match frontend type
      const item = typedEvent.item as {
        id: string;
        name: string;
        quantity: number;
        unit?: string;
        category?: string;
        notes?: string;
        completed?: boolean;
        completedAt?: string;
        addedAt?: string;
        updatedAt?: string;
      };
      const newItem: ShoppingListItemType = {
        id: item.id,
        shoppingListId: listId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        isCompleted: item.completed || false,
        completedAt: item.completedAt,
        createdAt: item.addedAt || '',
        updatedAt: item.updatedAt || item.addedAt || '',
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
    const handleItemUpdated = (event: unknown) => {
      // Check if event is for this list
      const typedEvent = event as { listId: string; item: Record<string, unknown> };
      if (typedEvent.listId !== listId) return;
      
      console.log('Shopping list item updated:', typedEvent);
      
      // Transform the event item to match frontend type
      const item = typedEvent.item as {
        id: string;
        name?: string;
        quantity?: number;
        unit?: string;
        category?: string;
        notes?: string;
        completed?: boolean;
        completedAt?: string;
        updatedAt?: string;
      };
      const updatedItem: Partial<ShoppingListItemType> = {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        isCompleted: item.completed || false,
        completedAt: item.completedAt,
        updatedAt: item.updatedAt,
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
    const handleItemDeleted = (event: unknown) => {
      // Check if event is for this list
      const typedEvent = event as { listId: string; itemId?: string; item?: { id?: string } };
      if (typedEvent.listId !== listId) return;
      
      console.log('Shopping list item deleted:', typedEvent);
      
      const deletedItemId = typedEvent.itemId || typedEvent.item?.id;
      
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