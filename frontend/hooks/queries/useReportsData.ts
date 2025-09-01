import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface ReportsData {
  wasteTracking: {
    currentMonth: number;
    previousMonth: number;
    percentageChange: number;
    weeklyData: Array<{
      week: string;
      value: number;
    }>;
  };
  categoryBreakdown: Array<{
    category: string;
    percentage: number;
    value: number;
  }>;
  expiryPatterns: Array<{
    dayOfWeek: string;
    count: number;
  }>;
  inventoryValue: number;
  totalItemsWasted: number;
  totalItemsConsumed: number;
  savingsFromConsumed: number;
}

// Mock data fallback for when API is not available
const mockReportsData: ReportsData = {
  wasteTracking: {
    currentMonth: 45,
    previousMonth: 56.25,
    percentageChange: -20,
    weeklyData: [
      { week: 'Week 1', value: 30 },
      { week: 'Week 2', value: 40 },
      { week: 'Week 3', value: 25 },
      { week: 'Week 4', value: 15 },
    ],
  },
  categoryBreakdown: [
    { category: 'Produce', percentage: 45, value: 20.25 },
    { category: 'Dairy', percentage: 30, value: 13.50 },
    { category: 'Leftovers', percentage: 15, value: 6.75 },
    { category: 'Meat', percentage: 10, value: 4.50 },
  ],
  expiryPatterns: [
    { dayOfWeek: 'Mon', count: 8 },
    { dayOfWeek: 'Tue', count: 6 },
    { dayOfWeek: 'Wed', count: 4 },
    { dayOfWeek: 'Thu', count: 2 },
    { dayOfWeek: 'Fri', count: 12 },
    { dayOfWeek: 'Sat', count: 10 },
    { dayOfWeek: 'Sun', count: 8 },
  ],
  inventoryValue: 487,
  totalItemsWasted: 15,
  totalItemsConsumed: 45,
  savingsFromConsumed: 124.50,
};

export const useReportsData = (dateRange: number = 30) => {
  const currentHouseholdId = useAuthStore((state) => state.currentHouseholdId);

  return useQuery({
    queryKey: ['reports', currentHouseholdId, dateRange],
    queryFn: async () => {
      if (!currentHouseholdId) {
        throw new Error('No household selected');
      }

      try {
        // Attempt to fetch from API
        // Note: The reports endpoint is not yet defined in API specs
        // Using household statistics as a fallback pattern
        const response = await apiClient.get(
          `/households/${currentHouseholdId}/statistics?days=${dateRange}`
        );
        
        // Transform API response to match our ReportsData interface
        // This transformation will need adjustment when the actual API is available
        const data = response.data;
        
        // If API returns data, transform it
        if (data && data.statistics) {
          return {
            wasteTracking: {
              currentMonth: data.statistics.wastedThisMonth || 0,
              previousMonth: data.statistics.wastedLastMonth || 0,
              percentageChange: data.statistics.wasteChangePercentage || 0,
              weeklyData: data.statistics.weeklyWaste || mockReportsData.wasteTracking.weeklyData,
            },
            categoryBreakdown: data.statistics.categoryBreakdown || mockReportsData.categoryBreakdown,
            expiryPatterns: data.statistics.expiryPatterns || mockReportsData.expiryPatterns,
            inventoryValue: data.statistics.inventoryValue || 0,
            totalItemsWasted: data.statistics.totalItemsWasted || 0,
            totalItemsConsumed: data.statistics.totalItemsConsumed || 0,
            savingsFromConsumed: data.statistics.savingsFromConsumed || 0,
          };
        }
        
        // If no statistics in response, return mock data
        return mockReportsData;
      } catch (error) {
        // If API is not available or returns an error, use mock data
        console.warn('Reports API not available, using mock data:', error);
        return mockReportsData;
      }
    },
    enabled: !!currentHouseholdId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once to avoid excessive API calls
  });
};

export default useReportsData;