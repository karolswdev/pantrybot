import { io, Socket } from 'socket.io-client';

type EventHandler = (data: unknown) => void;

interface SocketEventData {
  type: string;
  householdId: string;
  payload: unknown;
}

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  /**
   * Connect to the Socket.IO server
   */
  connect(token: string, householdId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Don't connect if already connected
      if (this.socket?.connected) {
        this.socket.emit('set-household', householdId);
        resolve();
        return;
      }

      // Disconnect any existing socket
      if (this.socket) {
        this.socket.disconnect();
      }

      const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Connection success
      this.socket.on('connect', () => {
        console.log('[Socket.IO] Connected to server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('set-household', householdId);
        resolve();
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('[Socket.IO] Connection error:', error.message);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Max reconnection attempts reached'));
        }
      });

      // Server confirmed connection
      this.socket.on('connected', (data: { userId: string; households: string[] }) => {
        console.log('[Socket.IO] Server confirmed connection:', data);
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('[Socket.IO] Disconnected:', reason);
        this.isConnected = false;
      });

      // Register event forwarding for all supported events
      const supportedEvents = [
        'item.added',
        'item.updated',
        'item.deleted',
        'item.consumed',
        'item.wasted',
        'list.created',
        'list.updated',
        'list.deleted',
        'list.item.added',
        'list.item.updated',
        'list.item.deleted',
        'member.joined',
        'member.left',
        'household.updated',
      ];

      supportedEvents.forEach((event) => {
        this.socket?.on(event, (data: SocketEventData) => {
          console.log(`[Socket.IO] Received event: ${event}`, data);
          this.eventHandlers.get(event)?.forEach((handler) => handler(data));
        });
      });

      // Timeout for initial connection
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Register an event handler
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove an event handler
   */
  off(event: string, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Remove all handlers for an event
   */
  offAll(event: string): void {
    this.eventHandlers.delete(event);
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[Socket.IO] Cannot emit, not connected');
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
      console.log('[Socket.IO] Disconnected');
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Also export the class for testing
export { SocketService };
