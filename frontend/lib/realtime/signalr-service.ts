import * as signalR from '@microsoft/signalr';

export type InventoryEventType = 'item.updated' | 'item.added' | 'item.deleted';
export type NotificationEventType = 'notification.new';

export interface InventoryEvent {
  type: InventoryEventType;
  householdId: string;
  payload: {
    itemId: string;
    item?: any; // Full item data for add/update
  };
}

export interface NotificationEvent {
  type: NotificationEventType;
  userId: string;
  payload: {
    id: string;
    type: string;
    message: string;
    items?: string[];
    timestamp: string;
  };
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly reconnectDelay = 5000; // 5 seconds

  constructor() {
    // Bind methods to ensure correct 'this' context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  async connect(token: string, householdId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('SignalR connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      // Create the connection with authentication
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(process.env.NEXT_PUBLIC_SIGNALR_URL || 'http://localhost:5000/hubs/inventory', {
          accessTokenFactory: () => token,
          headers: {
            'X-Household-Id': householdId
          }
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.elapsedMilliseconds < 30000) {
              // If we've been trying for less than 30 seconds, retry quickly
              return 2000;
            }
            // After 30 seconds, slow down retries
            return 10000;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers for connection lifecycle
      this.connection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
        this.emit('reconnecting', {});
      });

      this.connection.onreconnected(() => {
        console.log('SignalR reconnected');
        this.emit('reconnected', {});
      });

      this.connection.onclose(() => {
        console.log('SignalR connection closed');
        this.emit('disconnected', {});
        this.scheduleReconnect(token, householdId);
      });

      // Register event handlers for inventory events
      this.connection.on('ItemUpdated', (data: any) => {
        this.emit('item.updated', data);
      });

      this.connection.on('ItemAdded', (data: any) => {
        this.emit('item.added', data);
      });

      this.connection.on('ItemDeleted', (data: any) => {
        this.emit('item.deleted', data);
      });

      // Register event handlers for notification events
      this.connection.on('NotificationNew', (data: any) => {
        this.emit('notification.new', data);
      });

      // Start the connection
      await this.connection.start();
      console.log('SignalR connected successfully');
      this.emit('connected', {});

    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      this.scheduleReconnect(token, householdId);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connection) {
      try {
        await this.connection.stop();
        this.connection = null;
        console.log('SignalR disconnected');
      } catch (error) {
        console.error('Error disconnecting SignalR:', error);
      }
    }
  }

  private scheduleReconnect(token: string, householdId: string): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      console.log('Attempting to reconnect SignalR...');
      try {
        await this.connect(token, householdId);
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, this.reconnectDelay);
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  // Made public for testing purposes, but should normally be private
  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();

// Expose to window for Cypress testing
if (typeof window !== 'undefined') {
  (window as any).signalRService = signalRService;
}