import { io, Socket } from 'socket.io-client';

export type InventoryEventType = 'item.updated' | 'item.added' | 'item.deleted';
export type NotificationEventType = 'notification.new';
export type ShoppingListEventType = 'shoppinglist.item.added' | 'shoppinglist.item.updated' | 'shoppinglist.item.deleted';

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

export interface ShoppingListEvent {
  type: ShoppingListEventType;
  householdId: string;
  shoppingListId: string;
  payload: {
    itemId: string;
    item?: any; // Full item data for add/update
  };
}

class SignalRService {
  private socket: Socket | null = null;
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
    if (this.socket?.connected) {
      console.log('Socket.IO already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('Socket.IO connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      // Determine the WebSocket URL based on environment
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';
      
      // Create socket connection with authentication
      this.socket = io(wsUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 5
      });

      // Set up event handlers for connection lifecycle
      this.socket.on('connect', () => {
        console.log('Socket.IO connected successfully');
        // Send household context after connection
        if (householdId) {
          this.socket?.emit('set-household', householdId);
        }
        this.emit('connected', { householdId });
      });

      this.socket.on('connected', (data) => {
        console.log('Server acknowledged connection:', data);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.emit('disconnected', { reason });
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          this.scheduleReconnect(token, householdId);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error.message);
        this.emit('error', { error: error.message });
      });

      this.socket.io.on('reconnect', (attempt) => {
        console.log('Socket.IO reconnected after', attempt, 'attempts');
        this.emit('reconnected', { attempts: attempt });
      });

      this.socket.io.on('reconnect_attempt', (attempt) => {
        console.log('Socket.IO reconnecting... attempt', attempt);
        this.emit('reconnecting', { attempt });
      });

      // Register event handlers for inventory events
      this.socket.on('item.updated', (data: any) => {
        console.log('Received item.updated event:', data);
        this.emit('item.updated', data);
      });

      this.socket.on('item.added', (data: any) => {
        console.log('Received item.added event:', data);
        this.emit('item.added', data);
      });

      this.socket.on('item.deleted', (data: any) => {
        console.log('Received item.deleted event:', data);
        this.emit('item.deleted', data);
      });

      // Register event handlers for notification events
      this.socket.on('notification.new', (data: any) => {
        console.log('Received notification.new event:', data);
        this.emit('notification.new', data);
      });

      // Register event handlers for shopping list events
      this.socket.on('shoppinglist.item.added', (data: any) => {
        console.log('Received shoppinglist.item.added event:', data);
        this.emit('shoppinglist.item.added', data);
      });

      this.socket.on('shoppinglist.item.updated', (data: any) => {
        console.log('Received shoppinglist.item.updated event:', data);
        this.emit('shoppinglist.item.updated', data);
      });

      this.socket.on('shoppinglist.item.deleted', (data: any) => {
        console.log('Received shoppinglist.item.deleted event:', data);
        this.emit('shoppinglist.item.deleted', data);
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket.IO connection timeout'));
        }, 10000); // 10 second timeout

        this.socket!.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket!.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
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

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket.IO disconnected');
    }
  }

  private scheduleReconnect(token: string, householdId: string): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      console.log('Attempting to reconnect Socket.IO...');
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

  getConnectionState(): 'connected' | 'disconnected' | null {
    if (!this.socket) return null;
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();

// Expose to window for Cypress testing
if (typeof window !== 'undefined') {
  (window as any).signalRService = signalRService;
}