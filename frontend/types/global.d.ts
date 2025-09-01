// Global type definitions

// SignalR event types
export interface InventoryUpdateEvent {
  householdId: string;
  itemId: string;
  action: 'added' | 'updated' | 'deleted';
  item?: unknown;
}

export interface NotificationEvent {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}

export interface ShoppingListUpdateEvent {
  householdId: string;
  listId: string;
  action: 'added' | 'updated' | 'deleted';
  item?: unknown;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Mock data types
export interface MockResponseConfig {
  status?: number;
  data?: unknown;
  headers?: Record<string, string>;
}