import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Generate a link code for connecting Telegram
export interface GenerateLinkCodeResponse {
  code: string;
  expiresAt: string;
  instructions: string;
}

export function useGenerateTelegramLinkCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/v1/telegram/generate-link-code');
      return response.data as GenerateLinkCodeResponse;
    },
    onSuccess: () => {
      // Invalidate link status to refresh
      queryClient.invalidateQueries({ queryKey: ['telegram', 'link-status'] });
    },
  });
}

// Check if Telegram is linked
export interface TelegramLinkStatus {
  linked: boolean;
  telegramId?: string;
  linkedAt?: string;
}

export function useTelegramLinkStatus() {
  return useQuery({
    queryKey: ['telegram', 'link-status'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/telegram/link-status');
      return response.data as TelegramLinkStatus;
    },
    staleTime: 30000, // 30 seconds
  });
}

// Unlink Telegram account
export function useUnlinkTelegram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete('/api/v1/telegram/unlink');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'link-status'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
    },
  });
}

// Check Telegram bot status
export interface TelegramBotStatus {
  configured: boolean;
  available?: boolean;
  bot?: {
    id: number;
    username: string;
    firstName: string;
  };
  message?: string;
  error?: string;
}

export function useTelegramBotStatus() {
  return useQuery({
    queryKey: ['telegram', 'status'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/telegram/status');
      return response.data as TelegramBotStatus;
    },
    staleTime: 60000, // 1 minute
    retry: false,
  });
}
