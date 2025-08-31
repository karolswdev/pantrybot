import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

export interface HouseholdMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface HouseholdStatistics {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  consumedThisMonth: number;
  wastedThisMonth: number;
}

export interface HouseholdData {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  members: HouseholdMember[];
  statistics: HouseholdStatistics;
  createdAt: string;
}

export interface ExpiringItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: 'fridge' | 'freezer' | 'pantry';
  category?: string;
  expirationDate: string;
  daysUntilExpiration: number;
  expirationStatus: 'expired' | 'critical' | 'warning' | 'fresh';
}

export interface RecentActivity {
  id: string;
  action: 'created' | 'consumed' | 'wasted' | 'updated' | 'expired';
  itemName: string;
  userId: string;
  userDisplayName: string;
  timestamp: string;
  details?: string;
}

// Mock data for development when backend is not available
const MOCK_HOUSEHOLD_DATA: HouseholdData = {
  id: 'household-1',
  name: 'Smith Family Household',
  description: 'Our family household',
  timezone: 'America/New_York',
  members: [
    {
      userId: 'user-1',
      email: 'john@example.com',
      displayName: 'John',
      role: 'admin',
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user-2',
      email: 'jane@example.com',
      displayName: 'Jane',
      role: 'admin',
      joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: 'user-3',
      email: 'mike@example.com',
      displayName: 'Mike',
      role: 'member',
      joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  statistics: {
    totalItems: 47,
    expiringItems: 5,
    expiredItems: 0,
    consumedThisMonth: 28,
    wastedThisMonth: 3,
  },
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Hook to fetch household data for the dashboard
 * @param householdId - The ID of the household to fetch
 * @returns Query result with household data
 */
export function useHouseholdData(householdId?: string) {
  const user = useAuthStore((state) => state.user);
  const activeHouseholdId = householdId || user?.activeHouseholdId || 'household-1';

  return useQuery<HouseholdData>({
    queryKey: ['household', activeHouseholdId],
    queryFn: async () => {
      // Use mock data during development when backend is not available
      if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !process.env.NEXT_PUBLIC_API_URL) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_HOUSEHOLD_DATA;
      }
      
      if (!activeHouseholdId) {
        throw new Error('No household ID available');
      }
      
      const response = await apiClient.get(`/households/${activeHouseholdId}`);
      return response.data;
    },
    enabled: true, // Always enabled since we can use mock data
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
}

// Mock expiring items data
const MOCK_EXPIRING_ITEMS: ExpiringItem[] = [
  {
    id: 'item-1',
    name: 'Milk',
    quantity: 0.5,
    unit: 'gal',
    location: 'fridge',
    category: 'Dairy',
    expirationDate: new Date().toISOString(),
    daysUntilExpiration: 0,
    expirationStatus: 'critical',
  },
  {
    id: 'item-2',
    name: 'Lettuce',
    quantity: 1,
    unit: 'bag',
    location: 'fridge',
    category: 'Vegetables',
    expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    daysUntilExpiration: 1,
    expirationStatus: 'critical',
  },
  {
    id: 'item-3',
    name: 'Whole Wheat Bread',
    quantity: 1,
    unit: 'loaf',
    location: 'pantry',
    category: 'Grains',
    expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    daysUntilExpiration: 2,
    expirationStatus: 'warning',
  },
  {
    id: 'item-4',
    name: 'Cheddar Cheese',
    quantity: 200,
    unit: 'g',
    location: 'fridge',
    category: 'Dairy',
    expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    daysUntilExpiration: 3,
    expirationStatus: 'warning',
  },
  {
    id: 'item-5',
    name: 'Strawberries',
    quantity: 1,
    unit: 'lb',
    location: 'fridge',
    category: 'Fruits',
    expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    daysUntilExpiration: 3,
    expirationStatus: 'warning',
  },
];

/**
 * Hook to fetch expiring items for the dashboard
 * @param householdId - The ID of the household
 * @param limit - Maximum number of items to fetch (default: 5)
 * @returns Query result with expiring items
 */
export function useExpiringItems(householdId?: string, limit = 5) {
  const user = useAuthStore((state) => state.user);
  const activeHouseholdId = householdId || user?.activeHouseholdId || 'household-1';

  return useQuery<ExpiringItem[]>({
    queryKey: ['household', activeHouseholdId, 'expiring-items', limit],
    queryFn: async () => {
      // Use mock data during development when backend is not available
      if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !process.env.NEXT_PUBLIC_API_URL) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_EXPIRING_ITEMS.slice(0, limit);
      }
      
      if (!activeHouseholdId) {
        throw new Error('No household ID available');
      }
      
      const response = await apiClient.get(`/households/${activeHouseholdId}/items`, {
        params: {
          status: 'expiring_soon',
          sortBy: 'expirationDate',
          sortOrder: 'asc',
          pageSize: limit,
        },
      });
      
      return response.data.items.map((item: any) => ({
        ...item,
        expirationStatus: getExpirationStatus(item.daysUntilExpiration),
      }));
    },
    enabled: true, // Always enabled since we can use mock data
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch recent activity for the dashboard
 * @param householdId - The ID of the household
 * @param limit - Maximum number of activities to fetch (default: 5)
 * @returns Query result with recent activities
 */
export function useRecentActivity(householdId?: string, limit = 5) {
  const user = useAuthStore((state) => state.user);
  const activeHouseholdId = householdId || user?.activeHouseholdId;

  return useQuery<RecentActivity[]>({
    queryKey: ['household', activeHouseholdId, 'recent-activity', limit],
    queryFn: async () => {
      if (!activeHouseholdId) {
        throw new Error('No household ID available');
      }
      
      // This endpoint would need to be implemented on the backend
      // For now, we'll return mock data based on the household statistics
      const response = await apiClient.get(`/households/${activeHouseholdId}/activity`, {
        params: {
          limit,
        },
      });
      
      return response.data.activities;
    },
    enabled: !!activeHouseholdId,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

/**
 * Helper function to determine expiration status based on days until expiration
 */
function getExpirationStatus(daysUntilExpiration: number): ExpiringItem['expirationStatus'] {
  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 1) return 'critical';
  if (daysUntilExpiration <= 3) return 'warning';
  return 'fresh';
}

/**
 * Helper function to format expiration text
 */
export function formatExpirationText(daysUntilExpiration: number): string {
  if (daysUntilExpiration < 0) {
    const daysAgo = Math.abs(daysUntilExpiration);
    return daysAgo === 1 ? 'Expired yesterday' : `Expired ${daysAgo} days ago`;
  }
  if (daysUntilExpiration === 0) return 'Expires today';
  if (daysUntilExpiration === 1) return 'Tomorrow';
  return `In ${daysUntilExpiration} days`;
}

/**
 * Helper function to format activity timestamp
 */
export function formatActivityTime(timestamp: string): string {
  const now = new Date();
  const activityDate = new Date(timestamp);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return activityDate.toLocaleDateString();
}