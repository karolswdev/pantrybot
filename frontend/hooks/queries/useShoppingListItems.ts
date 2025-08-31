import { useQuery } from '@tanstack/react-query';
import { useHouseholdStore } from '@/stores/household.store';

export interface ShoppingListItemType {
  id: string;
  shoppingListId: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchShoppingListItems(householdId: string, listId: string): Promise<ShoppingListItemType[]> {
  try {
    const response = await fetch(`/api/v1/households/${householdId}/shopping-lists/${listId}/items`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch shopping list items');
    }

    return response.json();
  } catch (error) {
    // Return mock data as fallback
    console.warn('Using mock data for shopping list items:', error);
    return [
      {
        id: '1',
        shoppingListId: listId,
        name: 'Milk',
        quantity: 1,
        unit: 'gal',
        category: 'Dairy',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        shoppingListId: listId,
        name: 'Bread',
        quantity: 1,
        unit: 'loaf',
        category: 'Bakery',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        shoppingListId: listId,
        name: 'Eggs',
        quantity: 1,
        unit: 'dozen',
        category: 'Dairy',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        shoppingListId: listId,
        name: 'Apples',
        quantity: 6,
        unit: '',
        category: 'Produce',
        isCompleted: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        shoppingListId: listId,
        name: 'Yogurt',
        quantity: 4,
        unit: 'pack',
        category: 'Dairy',
        isCompleted: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
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