# Notification Store Documentation

## Overview

The notification store manages all notification-related state in the Pantrybot application, including in-app notifications and toast messages. It's built with Zustand and provides real-time notification handling through SignalR integration.

## Store Location

`/frontend/stores/notifications.store.ts`

## State Structure

```typescript
interface NotificationState {
  // Core notification state
  notifications: Notification[];    // Array of all notifications
  toasts: ToastMessage[];           // Array of active toast messages
  unreadCount: number;              // Count of unread notifications
  
  // Notification actions
  addNotification: (notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Toast actions
  showToast: (toast) => void;
  removeToast: (id: string) => void;
  
  // Real-time handling
  handleRealtimeNotification: (notification) => void;
}
```

## Data Types

### Notification

```typescript
interface Notification {
  id: string;
  type: "expiring" | "expired" | "low_stock" | "shopping" | "household" | "info";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}
```

### ToastMessage

```typescript
interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;  // Auto-dismiss duration in ms (default: 5000)
}
```

## Key Features

### 1. Notification Management

- **Add Notification**: Adds a new notification to the store and automatically shows a toast
- **Mark as Read**: Marks a single notification as read and updates the unread count
- **Mark All as Read**: Marks all notifications as read (useful when user opens dropdown)
- **Delete**: Removes a notification from the store
- **Clear All**: Removes all notifications

### 2. Toast System

- **Show Toast**: Displays a temporary toast message with auto-dismiss
- **Remove Toast**: Manually removes a toast before auto-dismiss
- **Auto-conversion**: New notifications automatically trigger toasts

### 3. Real-time Integration

The store integrates with SignalR for real-time notifications:

```typescript
// In your component or hook
import { signalRService } from '@/lib/realtime/signalr-service';
import { useNotificationStore } from '@/stores/notifications.store';

const { handleRealtimeNotification } = useNotificationStore();

// Subscribe to real-time events
signalRService.on('notification.new', (data) => {
  handleRealtimeNotification(data);
});
```

### 4. Persistence

The store uses Zustand's persist middleware to save notifications across page refreshes:

- Persisted data: `notifications` and `unreadCount`
- Storage key: `notification-storage`
- Not persisted: `toasts` (temporary by nature)

## Usage Examples

### Adding a Notification

```typescript
import { useNotificationStore } from '@/stores/notifications.store';

function MyComponent() {
  const { addNotification } = useNotificationStore();
  
  const handleItemExpired = () => {
    addNotification({
      type: 'expired',
      title: 'Item Expired',
      message: 'Milk has expired and should be discarded',
      metadata: { itemId: '123' }
    });
  };
}
```

### Showing a Toast

```typescript
import { useNotificationStore } from '@/stores/notifications.store';

function MyComponent() {
  const { showToast } = useNotificationStore();
  
  const handleSuccess = () => {
    showToast({
      type: 'success',
      title: 'Item Added',
      message: 'The item has been added to your inventory',
      duration: 3000  // Dismiss after 3 seconds
    });
  };
}
```

### Reading Notification State

```typescript
import { useNotificationStore } from '@/stores/notifications.store';

function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  
  return (
    <div>
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
}
```

### Handling Real-time Notifications

```typescript
import { useEffect } from 'react';
import { signalRService } from '@/lib/realtime/signalr-service';
import { useNotificationStore } from '@/stores/notifications.store';

function useRealtimeNotifications() {
  const { handleRealtimeNotification } = useNotificationStore();
  
  useEffect(() => {
    const handler = (data: any) => {
      handleRealtimeNotification({
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        read: false,
        createdAt: data.timestamp,
        metadata: data.metadata
      });
    };
    
    signalRService.on('notification.new', handler);
    
    return () => {
      signalRService.off('notification.new', handler);
    };
  }, [handleRealtimeNotification]);
}
```

## Notification Types

### expiring
Items approaching expiration date. Shows warning toast.

### expired
Items that have expired. Shows error toast.

### low_stock
Items running low in inventory. Shows info toast.

### shopping
Shopping list updates and reminders. Shows info toast.

### household
Household events (member joined, settings changed). Shows info toast.

### info
General information notifications. Shows info toast.

## Best Practices

1. **Use appropriate notification types** to ensure correct visual styling and icons
2. **Include metadata** for actionable notifications (e.g., itemId for navigation)
3. **Keep messages concise** - notifications should be scannable
4. **Use toasts for immediate feedback** after user actions
5. **Batch related notifications** to avoid overwhelming users
6. **Test real-time integration** using the SignalR service mock in Cypress

## Testing

The notification store can be tested using:

1. **Unit tests**: Test store actions in isolation
2. **Integration tests**: Test with React components
3. **E2E tests**: Use Cypress with SignalR mocking

Example Cypress test:

```javascript
cy.window().then((win) => {
  const signalRService = win.signalRService;
  signalRService.emit('notification.new', {
    id: 'test-1',
    type: 'expiring',
    title: 'Test Notification',
    message: 'Test message',
    timestamp: new Date().toISOString()
  });
});

cy.get('[data-testid="notification-badge"]').should('contain', '1');
```

## DevTools

The store includes Redux DevTools integration for debugging:

```javascript
// In browser console with Redux DevTools Extension
window.__REDUX_DEVTOOLS_EXTENSION__.getState()
```

View notification state changes, time-travel debugging, and action logs.