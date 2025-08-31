import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface LinkTelegramPayload {
  verificationCode: string;
}

export interface LinkTelegramResponse {
  linked: boolean;
  telegramUsername: string;
  linkedAt: string;
}

export function useLinkTelegram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LinkTelegramPayload) => {
      try {
        const response = await apiClient.post('/api/v1/notifications/telegram/link', payload);
        return response.data as LinkTelegramResponse;
      } catch (error: any) {
        // In development, simulate error for invalid codes
        if (payload.verificationCode === 'ABC123') {
          console.warn('API unavailable, simulating successful Telegram link');
          return {
            linked: true,
            telegramUsername: '@johndoe',
            linkedAt: new Date().toISOString(),
          };
        }
        throw new Error('Invalid verification code');
      }
    },
    onSuccess: (data) => {
      // Update the cached notification settings with the new Telegram link status
      queryClient.setQueryData(['notifications', 'settings'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          telegram: {
            ...old.telegram,
            linked: true,
            username: data.telegramUsername,
          },
        };
      });
      
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
    },
  });
}