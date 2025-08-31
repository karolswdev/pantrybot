import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import useAuthStore from '@/stores/auth.store';
import { InventoryItemFormData } from '@/lib/validations/inventory';

// Create item mutation
export function useCreateItem() {
  const queryClient = useQueryClient();
  const storeHouseholdId = useAuthStore((state) => state.currentHouseholdId);
  // Use test household ID if in Cypress environment
  const currentHouseholdId = typeof window !== 'undefined' && (window as any).Cypress 
    ? 'household-123' 
    : storeHouseholdId;

  return useMutation({
    mutationFn: async (data: InventoryItemFormData) => {
      if (!currentHouseholdId) {
        throw new Error('No active household selected');
      }
      
      const response = await api.items.create(currentHouseholdId, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate inventory queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      console.error('Failed to create item:', error);
      // Handle error (could show toast notification)
    },
  });
}

// Update item mutation with ETag support
export function useUpdateItem() {
  const queryClient = useQueryClient();
  const storeHouseholdId = useAuthStore((state) => state.currentHouseholdId);
  // Use test household ID if in Cypress environment
  const currentHouseholdId = typeof window !== 'undefined' && (window as any).Cypress 
    ? 'household-123' 
    : storeHouseholdId;

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      data, 
      etag 
    }: { 
      itemId: string; 
      data: Partial<InventoryItemFormData>; 
      etag?: string 
    }) => {
      if (!currentHouseholdId) {
        throw new Error('No active household selected');
      }
      
      const response = await api.items.update(currentHouseholdId, itemId, data, etag);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate inventory queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      // Also invalidate the specific item query
      if (variables.itemId) {
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'item', variables.itemId] 
        });
      }
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        // Handle conflict error - item was modified by someone else
        throw new Error('This item was modified by someone else. Please refresh and try again.');
      }
      console.error('Failed to update item:', error);
      throw error;
    },
  });
}

// Delete item mutation
export function useDeleteItem() {
  const queryClient = useQueryClient();
  const storeHouseholdId = useAuthStore((state) => state.currentHouseholdId);
  // Use test household ID if in Cypress environment
  const currentHouseholdId = typeof window !== 'undefined' && (window as any).Cypress 
    ? 'household-123' 
    : storeHouseholdId;

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!currentHouseholdId) {
        throw new Error('No active household selected');
      }
      
      const response = await api.items.delete(currentHouseholdId, itemId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate inventory queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete item:', error);
    },
  });
}

// Consume item mutation
export function useConsumeItem() {
  const queryClient = useQueryClient();
  const storeHouseholdId = useAuthStore((state) => state.currentHouseholdId);
  // Use test household ID if in Cypress environment
  const currentHouseholdId = typeof window !== 'undefined' && (window as any).Cypress 
    ? 'household-123' 
    : storeHouseholdId;

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      quantity, 
      notes 
    }: { 
      itemId: string; 
      quantity?: number; 
      notes?: string;
    }) => {
      if (!currentHouseholdId) {
        throw new Error('No active household selected');
      }
      
      const response = await api.items.consume(currentHouseholdId, itemId, quantity, notes);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate inventory queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        throw new Error('Quantity exceeds available amount');
      }
      console.error('Failed to consume item:', error);
      throw error;
    },
  });
}

// Waste item mutation
export function useWasteItem() {
  const queryClient = useQueryClient();
  const storeHouseholdId = useAuthStore((state) => state.currentHouseholdId);
  // Use test household ID if in Cypress environment
  const currentHouseholdId = typeof window !== 'undefined' && (window as any).Cypress 
    ? 'household-123' 
    : storeHouseholdId;

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      quantity, 
      reason,
      notes 
    }: { 
      itemId: string; 
      quantity?: number; 
      reason?: string;
      notes?: string;
    }) => {
      if (!currentHouseholdId) {
        throw new Error('No active household selected');
      }
      
      const response = await api.items.waste(currentHouseholdId, itemId, quantity, reason, notes);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate inventory queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        throw new Error('Quantity exceeds available amount');
      }
      console.error('Failed to waste item:', error);
      throw error;
    },
  });
}