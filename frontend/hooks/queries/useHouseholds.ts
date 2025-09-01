import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Household } from '@/stores/auth.store';

interface HouseholdsResponse {
  households: Array<{
    id: string;
    name: string;
    role: 'admin' | 'member' | 'viewer';
    memberCount: number;
    createdAt: string;
  }>;
}

export function useHouseholds() {
  return useQuery<HouseholdsResponse>({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/households');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}