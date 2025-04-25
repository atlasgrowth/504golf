import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '../types';
import { createSocket, getWebSocketUrl } from '../ws';

interface WebSocketHook {
  lastMessage: WebSocketMessage | null;
  sendMessage: (data: any) => void;
  readyState: number;
}

export const useWebSocket = (): WebSocketHook => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Setup WebSocket connection using shared utility
    const wsUrl = getWebSocketUrl();
    
    const socket = createSocket(wsUrl, (message) => {
      // Message handler callback
      setLastMessage(message);
    });
    
    socketRef.current = socket;
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setReadyState(WebSocket.OPEN);
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setReadyState(WebSocket.CLOSED);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    // Cleanup on unmount
    return () => {
      socket.close();
    };
  }, []);
  
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);
  
  return { lastMessage, sendMessage, readyState };
};