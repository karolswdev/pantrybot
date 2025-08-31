# SignalR Real-time Service

## Overview

The SignalR service provides real-time WebSocket communication between the Fridgr frontend and backend, enabling instant updates across all connected household members.

## How It Works

### Connection Lifecycle

1. **Authentication**: The service sends the JWT token during connection establishment via the `accessTokenFactory` option
2. **Household Scoping**: The `X-Household-Id` header ensures events are scoped to the correct household
3. **Automatic Reconnection**: Built-in retry logic with exponential backoff handles network interruptions
4. **Graceful Shutdown**: Clean disconnection when the user logs out or navigates away

### Event Subscription

The service uses an event emitter pattern for flexibility:

```typescript
import { signalRService } from '@/lib/realtime/signalr-service';

// Subscribe to events
signalRService.on('item.updated', (data) => {
  console.log('Item updated:', data);
});

// Unsubscribe when component unmounts
signalRService.off('item.updated', handler);
```

### Supported Events

#### Inventory Events
- `item.updated` - An existing inventory item was modified
- `item.added` - A new item was added to inventory
- `item.deleted` - An item was removed from inventory

#### Shopping List Events
- `shoppinglist.item.added` - A new item was added to a shopping list
- `shoppinglist.item.updated` - A shopping list item was modified (e.g., marked as bought)
- `shoppinglist.item.deleted` - An item was removed from a shopping list

#### Notification Events
- `notification.new` - A new notification was created

#### Connection Events
- `connected` - Successfully connected to the hub
- `disconnected` - Connection was closed
- `reconnecting` - Attempting to reconnect
- `reconnected` - Successfully reconnected after a disconnect

## Integration with React Query

The service integrates seamlessly with React Query to update the cache without refetching:

```typescript
// In your inventory component
useEffect(() => {
  const handleItemUpdate = (data: any) => {
    queryClient.setQueryData(
      ['inventory', householdId],
      (oldData: any) => {
        // Update the specific item in the cache
        return updateItemInList(oldData, data.itemId, data.item);
      }
    );
  };

  signalRService.on('item.updated', handleItemUpdate);
  return () => signalRService.off('item.updated', handleItemUpdate);
}, [householdId, queryClient]);
```

## Authentication & Token Refresh

The service handles authentication by:
1. Including the JWT access token in the connection request
2. Reconnecting with a new token when the current one expires
3. The token refresh is handled by the auth service before reconnection

## Error Handling

- Connection failures trigger automatic reconnection with exponential backoff
- Event handler errors are caught and logged without affecting other handlers
- Network interruptions are handled gracefully with state preservation

## Usage Example

```typescript
// Connect when user logs in
await signalRService.connect(accessToken, householdId);

// Check connection status
if (signalRService.isConnected()) {
  console.log('Real-time updates active');
}

// Disconnect when user logs out
await signalRService.disconnect();
```