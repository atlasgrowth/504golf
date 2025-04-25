import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketHook {
  lastMessage: any;
  sendMessage: (data: any) => void;
  readyState: number;
}

export const useWebSocket = (bayId?: number): WebSocketHook => {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setReadyState(WebSocket.OPEN);
      
      // Subscribe to specific bay if provided
      if (bayId) {
        socket.send(JSON.stringify({
          type: 'subscribeToBay',
          bayId
        }));
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    socket.onclose = () => {
      setReadyState(WebSocket.CLOSED);
    };

    return () => {
      socket.close();
    };
  }, [bayId]);

  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { lastMessage, sendMessage, readyState };
};

export default useWebSocket;
