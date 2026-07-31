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

  const getWSUrl = useCallback(() => {
    const envApiUrl = import.meta.env.VITE_API_BASE_URL;
    if (envApiUrl && envApiUrl.trim().startsWith('http')) {
      const wsBase = envApiUrl.trim().replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '');
      return `${wsBase}/ws/${channel}`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/${channel}`;
  }, [channel]);

  const connect = useCallback(() => {
    try {
      const wsUrl = getWSUrl();
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
  }, [getWSUrl, onEvent]);

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
