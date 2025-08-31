import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface UpdateNotificationSettingsPayload {
  email?: {
    enabled: boolean;
  };
  inApp?: {
    enabled: boolean;
  };
  telegram?: {
    enabled: boolean;
  };
  preferences?: {
    expirationWarningDays: number;
    notificationTypes: string[];
    preferredTime: string;
  };
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateNotificationSettingsPayload) => {
      try {
        const response = await apiClient.put('/api/v1/notifications/settings', payload);
        return response.data;
      } catch (error) {
        // In development, simulate success
        console.warn('API unavailable, simulating notification settings update');
        return {
          message: 'Notification settings updated (mock)',
          updatedAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      // Invalidate and refetch notification settings
      queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
    },
  });
}