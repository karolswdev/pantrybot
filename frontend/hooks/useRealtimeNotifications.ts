import { useEffect } from "react";
import { signalRService } from "@/lib/realtime/signalr-service";
import { useNotificationStore } from "@/stores/notifications.store";
import { useAuthStore } from "@/stores/auth.store";

export function useRealtimeNotifications() {
  const { handleRealtimeNotification } = useNotificationStore();
  const { user, currentHouseholdId } = useAuthStore();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    if (!token || !currentHouseholdId) {
      return;
    }

    // Handler for new notifications
    const handleNotificationNew = (data: unknown) => {
      console.log("Received notification via SignalR:", data);
      
      // Transform the SignalR notification to our notification format
      const eventData = data as {
        id?: string;
        type?: string;
        title?: string;
        message?: string;
        timestamp?: string;
        metadata?: Record<string, unknown>;
      };
      const notification = {
        id: eventData.id || crypto.randomUUID(),
        type: (eventData.type || "info") as "expiring" | "expired" | "low_stock" | "shopping" | "household" | "info",
        title: eventData.title || "New Notification",
        message: eventData.message || "",
        read: false,
        createdAt: eventData.timestamp || new Date().toISOString(),
        metadata: eventData.metadata || {},
      };
      
      handleRealtimeNotification(notification);
    };

    // Subscribe to notification events
    signalRService.on("notification.new", handleNotificationNew);

    // Connect to SignalR if not already connected
    if (!signalRService.isConnected()) {
      signalRService.connect(token, currentHouseholdId).catch((error) => {
        console.error("Failed to connect to SignalR for notifications:", error);
      });
    }

    // Cleanup function
    return () => {
      signalRService.off("notification.new", handleNotificationNew);
    };
  }, [token, currentHouseholdId, handleRealtimeNotification]);
}