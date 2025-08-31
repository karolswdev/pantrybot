import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from './page';

// Mock the dashboard components
jest.mock('@/components/dashboard/StatCard', () => ({
  StatCard: ({ title, value }: any) => (
    <div data-testid="stat-card">
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}));

jest.mock('@/components/dashboard/ExpiringItemsList', () => ({
  ExpiringItemsList: ({ items, loading }: any) => {
    if (loading) {
      return <div data-testid="expiring-items-loading">Loading expiring items...</div>;
    }
    return (
      <div data-testid="expiring-items-list">
        {items.map((item: any) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    );
  },
}));

jest.mock('@/components/dashboard/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

jest.mock('@/components/dashboard/RecentActivity', () => ({
  RecentActivity: ({ activities, loading }: any) => {
    if (loading) {
      return <div data-testid="recent-activity-loading">Loading recent activity...</div>;
    }
    return (
      <div data-testid="recent-activity">
        {activities.map((activity: any) => (
          <div key={activity.id}>{activity.message}</div>
        ))}
      </div>
    );
  },
}));

jest.mock('@/components/dashboard/DashboardSkeleton', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading skeleton...</div>,
}));

jest.mock('@/components/dashboard/EmptyDashboard', () => ({
  EmptyDashboard: () => (
    <div data-testid="empty-dashboard">
      <h2>Your inventory is empty!</h2>
      <p>Start adding items to track expiration dates and reduce food waste.</p>
    </div>
  ),
}));

// Mock the auth store
jest.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      user: {
        displayName: 'John',
        activeHouseholdId: 'household-1',
      },
    };
    return selector ? selector(state) : state;
  },
}));

// Mock the hooks
const mockUseHouseholdData = jest.fn();
const mockUseExpiringItems = jest.fn();

jest.mock('@/hooks/queries/useHouseholdData', () => ({
  useHouseholdData: () => mockUseHouseholdData(),
  useExpiringItems: () => mockUseExpiringItems(),
  formatExpirationText: (days: number) => {
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  },
  formatActivityTime: (timestamp: string) => timestamp,
}));

describe('Dashboard Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show a loading skeleton while fetching data', () => {
    // Mock loading state
    mockUseHouseholdData.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    mockUseExpiringItems.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<DashboardPage />);

    // Assert that the loading skeleton is displayed
    const skeleton = screen.getByTestId('dashboard-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveTextContent('Loading skeleton...');

    // Verify that other components are not rendered
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('expiring-items-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recent-activity')).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-dashboard')).not.toBeInTheDocument();
  });

  it('should show an empty state when there are no items', () => {
    // Mock empty state
    mockUseHouseholdData.mockReturnValue({
      data: {
        id: 'household-1',
        name: 'Smith Family Household',
        statistics: {
          totalItems: 0,
          expiringItems: 0,
          expiredItems: 0,
          consumedThisMonth: 0,
          wastedThisMonth: 0,
        },
      },
      isLoading: false,
    });
    mockUseExpiringItems.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<DashboardPage />);

    // Assert that the empty state component is displayed
    const emptyState = screen.getByTestId('empty-dashboard');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveTextContent('Your inventory is empty!');
    expect(emptyState).toHaveTextContent('Start adding items to track expiration dates and reduce food waste.');

    // Verify that other components are not rendered
    expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('expiring-items-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recent-activity')).not.toBeInTheDocument();
  });

  it('should render dashboard with data when not loading and not empty', () => {
    // Mock normal state with data
    mockUseHouseholdData.mockReturnValue({
      data: {
        id: 'household-1',
        name: 'Smith Family Household',
        statistics: {
          totalItems: 47,
          expiringItems: 5,
          expiredItems: 0,
          consumedThisMonth: 28,
          wastedThisMonth: 3,
        },
      },
      isLoading: false,
    });
    mockUseExpiringItems.mockReturnValue({
      data: [
        {
          id: 'item-1',
          name: 'Milk',
          location: 'fridge',
          daysUntilExpiration: 0,
        },
        {
          id: 'item-2',
          name: 'Lettuce',
          location: 'fridge',
          daysUntilExpiration: 1,
        },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);

    // Verify welcome message
    expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
    expect(screen.getByText('Smith Family Household')).toBeInTheDocument();

    // Verify that stat cards are rendered
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards).toHaveLength(4);

    // Verify expiring items list is rendered
    expect(screen.getByTestId('expiring-items-list')).toBeInTheDocument();

    // Verify quick actions are rendered
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();

    // Verify recent activity is rendered
    expect(screen.getByTestId('recent-activity')).toBeInTheDocument();

    // Verify skeleton and empty state are not rendered
    expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-dashboard')).not.toBeInTheDocument();
  });
});