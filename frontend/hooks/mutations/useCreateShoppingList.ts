import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface CreateShoppingListInput {
  name: string;
  notes?: string;
}

interface CreateShoppingListResponse {
  id: string;
  name: string;
  notes: string;
  items: any[];
  createdAt: string;
  createdBy: string;
}

export function useCreateShoppingList(householdId: string) {
  const queryClient = useQueryClient();

  return useMutation<CreateShoppingListResponse, Error, CreateShoppingListInput>({
    mutationFn: async (data: CreateShoppingListInput) => {
      if (!householdId) {
        throw new Error('Household ID is required');
      }

      const response = await apiClient.post(
        `/households/${householdId}/shopping-lists`,
        data
      );
      return response.data;
    },
    onSuccess: (newList) => {
      // Invalidate and refetch shopping lists after successful creation
      queryClient.invalidateQueries({ 
        queryKey: ['shopping-lists', householdId] 
      });

      // Optionally update the cache directly
      queryClient.setQueryData(['shopping-lists', householdId], (oldData: any) => {
        if (!oldData) return oldData;
        
        const newListForCache = {
          id: newList.id,
          name: newList.name,
          itemCount: 0,
          completedCount: 0,
          createdAt: newList.createdAt,
          createdBy: newList.createdBy,
          lastUpdated: newList.createdAt,
        };

        return {
          ...oldData,
          lists: [...(oldData.lists || []), newListForCache],
          total: (oldData.total || 0) + 1,
        };
      });
    },
  });
}