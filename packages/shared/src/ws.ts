import { WebSocketMessage, ClientRegistrationMessage } from './types';

/**
 * Get the WebSocket URL based on the current window location
 */
export function getWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  return wsUrl;
}

/**
 * Create a new WebSocket connection
 * @param url The WebSocket URL to connect to
 * @param onMessage Optional callback for handling messages
 * @returns The WebSocket instance
 */
export function createSocket(
  url: string, 
  onMessage?: (message: WebSocketMessage) => void
): WebSocket {
  const socket = new WebSocket(url);
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      if (onMessage) {
        onMessage(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  return socket;
}

/**
 * Register a client with the WebSocket server
 * @param socket The WebSocket instance
 * @param clientType The type of client (guest, server, kitchen)
 * @param bayId Optional bay ID for guest and server clients
 */
export function registerClient(
  socket: WebSocket,
  clientType: 'guest' | 'server' | 'kitchen',
  bayId?: number
): void {
  if (socket.readyState === WebSocket.OPEN) {
    const message: ClientRegistrationMessage = {
      type: 'register',
      data: { 
        clientType,
        ...(bayId !== undefined && { bayId })
      }
    };
    
    socket.send(JSON.stringify(message));
  } else {
    console.error('Cannot register client - WebSocket not connected');
  }
}

/**
 * Reconnect WebSocket with exponential backoff
 * @param url The WebSocket URL
 * @param onMessage Callback for handling messages
 * @param maxRetries Maximum number of retries
 * @returns The reconnection controller with abort capability
 */
export function reconnectWithBackoff(
  url: string,
  onMessage: (message: WebSocketMessage) => void,
  maxRetries = 5
): { abort: () => void } {
  let retryCount = 0;
  let timeoutId: number | null = null;
  let aborted = false;
  
  function connect() {
    if (aborted) return;
    
    const socket = createSocket(url, onMessage);
    
    socket.onopen = () => {
      // Reset retry count on successful connection
      retryCount = 0;
    };
    
    socket.onclose = (event) => {
      // Don't try to reconnect if deliberately closed
      if (event.wasClean || aborted) return;
      
      // Calculate retry delay with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      retryCount++;
      
      if (retryCount <= maxRetries) {
        console.log(`WebSocket reconnecting in ${delay}ms (attempt ${retryCount}/${maxRetries})...`);
        timeoutId = window.setTimeout(connect, delay);
      } else {
        console.error('Maximum WebSocket reconnection attempts reached');
      }
    };
    
    return socket;
  }
  
  connect();
  
  return {
    abort: () => {
      aborted = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  };
}