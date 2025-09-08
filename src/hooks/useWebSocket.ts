import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'status_update' | 'progress_update' | 'error' | 'connection_status';
  collectionId?: string;
  status?: string;
  progress?: number;
  message?: string;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: WebSocketMessage) => void;
  disconnect: () => void;
  reconnect: () => void;
  connectionAttempts: number;
}

/**
 * Custom hook for WebSocket connection with automatic reconnection
 * and real-time status updates for collection processing
 */
export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef(false);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);
    isManuallyClosedRef.current = false;

    try {
      // In development, simulate WebSocket with a mock connection
      if (process.env.NODE_ENV === 'development') {
        // Simulate WebSocket connection for development
        const mockWs = {
          readyState: WebSocket.OPEN,
          send: (data: string) => {
            console.log('📤 Mock WebSocket send:', data);
          },
          close: () => {
            console.log('🔌 Mock WebSocket closed');
          }
        } as WebSocket;

        wsRef.current = mockWs;
        
        setTimeout(() => {
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionAttempts(0);
          onConnect?.();
          
          // Simulate periodic status updates
          const interval = setInterval(() => {
            if (!isManuallyClosedRef.current) {
              const mockMessage: WebSocketMessage = {
                type: 'status_update',
                collectionId: `collection-${Math.floor(Math.random() * 3) + 1}`,
                status: ['processing', 'ready', 'failed'][Math.floor(Math.random() * 3)],
                progress: Math.floor(Math.random() * 100),
                timestamp: new Date().toISOString()
              };
              onMessage?.(mockMessage);
            } else {
              clearInterval(interval);
            }
          }, 5000);
        }, 1000);

        return;
      }

      // Real WebSocket connection for production
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionAttempts(0);
        setError(null);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.(error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // Attempt reconnection if not manually closed
        if (!isManuallyClosedRef.current && connectionAttempts < maxReconnectAttempts) {
          setConnectionAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

    } catch (err) {
      setError(`Failed to connect: ${err}`);
      setIsConnecting(false);
    }
  }, [url, connectionAttempts, maxReconnectAttempts, reconnectInterval, onConnect, onMessage, onError, onDisconnect]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionAttempts(0);
  }, [clearReconnectTimeout]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      setConnectionAttempts(0);
      connect();
    }, 100);
  }, [disconnect, connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    disconnect,
    reconnect,
    connectionAttempts
  };
};