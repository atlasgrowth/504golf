/**
 * WebSocket-related utilities for the kitchen management system
 */

import { WebSocket } from 'ws';
import { WebSocketMessage, WebSocketMessageType } from '@shared/types';

// Map to store all connected WebSocket clients
const clients = new Map<string, { 
  ws: WebSocket, 
  clientType?: 'kitchen' | 'server' | 'guest', 
  bayId?: number,
  station?: string
}>();

/**
 * Register a new websocket client
 */
export function registerClient(
  clientId: string, 
  ws: WebSocket, 
  clientType?: 'kitchen' | 'server' | 'guest', 
  bayId?: number,
  station?: string
) {
  clients.set(clientId, { ws, clientType, bayId, station });
  console.log(`Client ${clientId} registered as ${clientType}${bayId ? ` for bay ${bayId}` : ''}${station ? ` for station ${station}` : ''}`);
}

/**
 * Remove a client when disconnected
 */
export function removeClient(clientId: string) {
  clients.delete(clientId);
}

/**
 * Get all connected clients
 */
export function getClients() {
  return clients;
}

/**
 * Send update to all connected clients
 */
export function broadcastUpdate(type: WebSocketMessageType, data: any) {
  const message: WebSocketMessage = { type, data };
  
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Send update to clients for a specific bay
 */
export function sendBayUpdate(bayId: number, type: WebSocketMessageType, data: any) {
  const message: WebSocketMessage = { type, data };
  
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN && client.bayId === bayId) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Send update to clients for a specific station (kitchen display)
 */
export function sendStationUpdate(station: string, type: WebSocketMessageType, data: any) {
  const message: WebSocketMessage = { type, data };
  
  clients.forEach(client => {
    // Send to clients with matching station or to all kitchen clients if they haven't specified a station
    if (
      client.ws.readyState === WebSocket.OPEN && 
      (
        (client.clientType === 'kitchen' && (!client.station || client.station === station || client.station === '*'))
      )
    ) {
      client.ws.send(JSON.stringify(message));
    }
  });
}