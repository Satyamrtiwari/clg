import { useEffect, useRef, useState, useCallback } from 'react';

interface WSEvent {
  event: string;
  timestamp: string;
  data: any;
}

export const useWebSocket = (channel: string = 'display', onEvent?: (event: WSEvent) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/${channel}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        // Start ping interval to keep connection active
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
        (ws as any).pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const parsed: WSEvent = JSON.parse(event.data);
          if (onEvent) {
            onEvent(parsed);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if ((ws as any).pingInterval) clearInterval((ws as any).pingInterval);
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }
  }, [channel, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        if ((wsRef.current as any).pingInterval) clearInterval((wsRef.current as any).pingInterval);
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
};
