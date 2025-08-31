import { useEffect } from "react";
import { signalRService } from "@/lib/realtime/signalr-service";
import { useNotificationStore } from "@/stores/notifications.store";
import { useAuthStore } from "@/stores/auth.store";

export function useRealtimeNotifications() {
  const { handleRealtimeNotification } = useNotificationStore();
  const { token, activeHouseholdId } = useAuthStore();

  useEffect(() => {
    if (!token || !activeHouseholdId) {
      return;
    }

    // Handler for new notifications
    const handleNotificationNew = (data: any) => {
      console.log("Received notification via SignalR:", data);
      
      // Transform the SignalR notification to our notification format
      const notification = {
        id: data.id || crypto.randomUUID(),
        type: data.type || "info" as any,
        title: data.title || "New Notification",
        message: data.message || "",
        read: false,
        createdAt: data.timestamp || new Date().toISOString(),
        metadata: data.metadata || {},
      };
      
      handleRealtimeNotification(notification);
    };

    // Subscribe to notification events
    signalRService.on("notification.new", handleNotificationNew);

    // Connect to SignalR if not already connected
    if (!signalRService.isConnected()) {
      signalRService.connect(token, activeHouseholdId).catch((error) => {
        console.error("Failed to connect to SignalR for notifications:", error);
      });
    }

    // Cleanup function
    return () => {
      signalRService.off("notification.new", handleNotificationNew);
    };
  }, [token, activeHouseholdId, handleRealtimeNotification]);
}