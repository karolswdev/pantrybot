import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface NotificationSettings {
  email: {
    enabled: boolean;
    address: string;
  };
  inApp: {
    enabled: boolean;
  };
  telegram: {
    enabled: boolean;
    linked: boolean;
    username: string | null;
  };
  preferences: {
    expirationWarningDays: number;
    notificationTypes: string[];
    preferredTime: string;
    timezone: string;
  };
}

// Mock data for development
const MOCK_SETTINGS: NotificationSettings = {
  email: {
    enabled: true,
    address: 'user@example.com',
  },
  inApp: {
    enabled: true,
  },
  telegram: {
    enabled: false,
    linked: false,
    username: null,
  },
  preferences: {
    expirationWarningDays: 3,
    notificationTypes: ['expiration', 'lowStock', 'shoppingReminder'],
    preferredTime: '09:00',
    timezone: 'America/New_York',
  },
};

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/v1/notifications/settings');
        return response.data as NotificationSettings;
      } catch (error) {
        // Return mock data when API is unavailable
        console.warn('API unavailable, using mock notification settings');
        return MOCK_SETTINGS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry when backend is down
  });
}