'use client';

import { useMemo } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExpiringItemsList, ExpiringItem } from '@/components/dashboard/ExpiringItemsList';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard';
import { useHouseholdData, useExpiringItems, formatExpirationText, formatActivityTime } from '@/hooks/queries/useHouseholdData';
import { useAuthStore } from '@/stores/auth.store';

// Food emojis mapping for items
const FOOD_EMOJIS: Record<string, string> = {
  'milk': '🥛',
  'lettuce': '🥬',
  'bread': '🍞',
  'cheese': '🧀',
  'strawberries': '🍓',
  'apple': '🍎',
  'banana': '🍌',
  'carrot': '🥕',
  'tomato': '🍅',
  'egg': '🥚',
  'chicken': '🍗',
  'beef': '🥩',
  'fish': '🐟',
  'default': '🍽️',
};

function getItemEmoji(itemName: string): string {
  const lowercaseName = itemName.toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (lowercaseName.includes(key)) {
      return emoji;
    }
  }
  return FOOD_EMOJIS.default;
}

// Mock recent activities since the backend doesn't have this endpoint yet
function generateMockActivities(householdData: any): ActivityItem[] {
  const activities: ActivityItem[] = [
    { id: '1', type: 'add', message: 'added 6 items from Walmart', timestamp: '2h ago', user: 'Jane' },
    { id: '2', type: 'consume', message: 'consumed Almond Milk', timestamp: '5h ago', user: 'You' },
  ];
  
  if (householdData?.statistics?.expiredItems > 0) {
    activities.push({
      id: '3',
      type: 'expire',
      message: `${householdData.statistics.expiredItems} item(s) expired`,
      timestamp: 'Yesterday',
      user: 'System',
    });
  }
  
  activities.push(
    { id: '4', type: 'add', message: 'added Pizza to freezer', timestamp: 'Yesterday', user: 'Mike' }
  );
  
  return activities;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: householdData, isLoading: isLoadingHousehold } = useHouseholdData();
  const { data: expiringItems, isLoading: isLoadingExpiring } = useExpiringItems();
  
  const isLoading = isLoadingHousehold || isLoadingExpiring;
  
  // Transform expiring items for the component
  const formattedExpiringItems = useMemo<ExpiringItem[]>(() => {
    if (!expiringItems) return [];
    
    return expiringItems.map(item => ({
      id: item.id,
      name: item.name,
      emoji: getItemEmoji(item.name),
      location: item.location,
      expiresIn: formatExpirationText(item.daysUntilExpiration),
      daysUntilExpiration: item.daysUntilExpiration,
    }));
  }, [expiringItems]);
  
  // Generate mock activities (in production, this would come from the API)
  const activities = useMemo<ActivityItem[]>(() => {
    if (!householdData) return [];
    return generateMockActivities(householdData);
  }, [householdData]);
  
  const isEmpty = householdData?.statistics?.totalItems === 0;

  // Handle loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Handle empty state
  if (isEmpty) {
    return <EmptyDashboard />;
  }

  // Calculate additional statistics
  const expiringTodayCount = expiringItems?.filter(item => item.daysUntilExpiration === 0).length || 0;
  
  // Calculate waste cost (mock calculation)
  const wasteValue = householdData?.statistics?.wastedThisMonth 
    ? (householdData.statistics.wastedThisMonth * 2.5).toFixed(2) 
    : '0.00';
  
  // Calculate weekly spend (mock calculation)
  const weeklySpend = householdData?.statistics?.consumedThisMonth
    ? ((householdData.statistics.consumedThisMonth * 3.5) / 4).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.displayName || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">{householdData?.name || 'Your Household'}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={householdData?.statistics?.totalItems || 0}
          trend={{ value: '12%', direction: 'up' }}
        />
        <StatCard
          title="Expiring Soon"
          value={householdData?.statistics?.expiringItems || 0}
          alert={expiringTodayCount > 0 ? `${expiringTodayCount} today` : undefined}
        />
        <StatCard
          title="This Week"
          value={`$${weeklySpend}`}
          trend={{ value: '8%', direction: 'down' }}
        />
        <StatCard
          title="Wasted"
          value={`$${wasteValue}`}
          trend={{ value: '3%', direction: 'up' }}
        />
      </div>

      {/* Expiring Items List */}
      <ExpiringItemsList items={formattedExpiringItems} loading={isLoadingExpiring} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <RecentActivity activities={activities} loading={false} />
    </div>
  );
}