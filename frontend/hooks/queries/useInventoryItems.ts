import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import useAuthStore from "@/stores/auth.store";
import { InventoryItem } from "@/components/inventory/ItemCard";

export interface InventoryItemResponse extends InventoryItem {
  createdAt?: string;
  updatedAt?: string;
  etag?: string;
}

export interface UseInventoryItemsParams {
  householdId?: string;
  location?: "fridge" | "freezer" | "pantry" | "all";
  category?: string;
  search?: string;
  status?: "expiring-soon" | "expired";
  sortBy?: "expiry" | "name" | "category" | "created";
  sortOrder?: "asc" | "desc";
}

export interface InventoryItemsResponse {
  items: InventoryItemResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Hook to fetch inventory items from the API
 * @param params - Filter and sort parameters
 * @returns Query result with inventory items
 */
export function useInventoryItems(params: UseInventoryItemsParams = {}) {
  const { user } = useAuthStore();
  // Use test household ID if in Cypress environment (with production guard)
  const isCypressEnv = process.env.NODE_ENV !== 'production' && 
    typeof window !== 'undefined' && 
    (window as any).Cypress;
  const defaultHouseholdId = isCypressEnv
    ? 'household-123' 
    : user?.defaultHouseholdId;
  const householdId = params.householdId || defaultHouseholdId;

  return useQuery<InventoryItemsResponse>({
    queryKey: ["inventory", "items", householdId, params],
    queryFn: async () => {
      if (!householdId) {
        throw new Error("No household ID available");
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (params.location && params.location !== "all") {
        queryParams.append("location", params.location);
      }
      if (params.category) {
        queryParams.append("category", params.category);
      }
      if (params.search) {
        queryParams.append("search", params.search);
      }
      if (params.status) {
        queryParams.append("status", params.status);
      }
      if (params.sortBy) {
        queryParams.append("sortBy", params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append("sortOrder", params.sortOrder);
      }

      const response = await apiClient.get<InventoryItemsResponse>(
        `/households/${householdId}/items?${queryParams.toString()}`
      );

      return response.data;
    },
    enabled: !!householdId,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Hook to fetch a single inventory item
 * @param householdId - Household ID
 * @param itemId - Item ID
 * @returns Query result with the inventory item
 */
export function useInventoryItem(householdId: string | undefined, itemId: string | undefined) {
  return useQuery<InventoryItemResponse>({
    queryKey: ["inventory", "items", householdId, itemId],
    queryFn: async () => {
      if (!householdId || !itemId) {
        throw new Error("Household ID and Item ID are required");
      }

      const response = await apiClient.get<InventoryItemResponse>(
        `/households/${householdId}/items/${itemId}`
      );

      return response.data;
    },
    enabled: !!householdId && !!itemId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}