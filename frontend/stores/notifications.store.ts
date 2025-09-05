import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface Notification {
  id: string;
  type: "expiring" | "expired" | "low_stock" | "shopping" | "household" | "info";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  toasts: ToastMessage[];
  unreadCount: number;
  
  // Actions for notifications
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Actions for toasts
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  
  // Real-time updates
  handleRealtimeNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        notifications: [],
        toasts: [],
        unreadCount: 0,

        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            read: false,
          };
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
          
          // Also show a toast for immediate feedback
          get().showToast({
            type: notification.type === "expired" ? "error" : 
                  notification.type === "expiring" ? "warning" : "info",
            title: notification.title,
            message: notification.message,
          });
        },

        markAsRead: (id) => {
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            if (!notification || notification.read) return state;
            
            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          });
        },

        markAllAsRead: () => {
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }));
        },

        deleteNotification: (id) => {
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            const wasUnread = notification && !notification.read;
            
            return {
              notifications: state.notifications.filter((n) => n.id !== id),
              unreadCount: wasUnread 
                ? Math.max(0, state.unreadCount - 1) 
                : state.unreadCount,
            };
          });
        },

        clearAllNotifications: () => {
          set({ notifications: [], unreadCount: 0 });
        },

        showToast: (toast) => {
          const newToast: ToastMessage = {
            ...toast,
            id: crypto.randomUUID(),
          };
          
          set((state) => ({
            toasts: [...state.toasts, newToast],
          }));
        },

        removeToast: (id) => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        },

        handleRealtimeNotification: (notification) => {
          // This will be called when we receive a notification via SignalR
          set((state) => {
            // Check if notification already exists (by ID or by checking recent notifications)
            const exists = state.notifications.some((n) => n.id === notification.id);
            if (exists) return state;
            
            const isUnread = !notification.read;
            
            return {
              notifications: [notification, ...state.notifications],
              unreadCount: isUnread 
                ? state.unreadCount + 1 
                : state.unreadCount,
            };
          });
          
          // Show toast for new notifications
          if (!notification.read) {
            get().showToast({
              type: notification.type === "expired" ? "error" : 
                    notification.type === "expiring" ? "warning" : "info",
              title: notification.title,
              message: notification.message,
            });
          }
        },
      }),
      {
        name: "notification-storage",
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
        }),
      }
    ),
    { name: "NotificationStore" }
  )
);