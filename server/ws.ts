import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from './db';
import { orders, orderItems, menuItems } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { WebSocketMessage } from '../shared/types';

// WebSocket clients
export const clients = new Map<string, { ws: WebSocket, bayId?: number }>();

/**
 * Send update to all connected clients
 */
export function broadcastUpdate(type: string, data: any) {
  const message: WebSocketMessage = { type: type as any, data };
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Send update to clients for a specific bay
 */
export function sendBayUpdate(bayId: number, type: string, data: any) {
  const message: WebSocketMessage = { type: type as any, data };
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN && client.bayId === bayId) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Enrich an order with its items and calculate if it's delayed
 */
export async function enrichOrder(orderId: string) {
  // Get the order
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return null;
  
  // Get order items
  const orderItemsList = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  
  // Get menu items for each order item
  const enrichedItems = await Promise.all(
    orderItemsList.map(async (item) => {
      const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId));
      return { ...item, menuItem };
    })
  );
  
  // Calculate if the order is delayed
  let isDelayed = false;
  if (order.estimatedCompletionTime) {
    const estimatedTime = new Date(order.estimatedCompletionTime);
    // Add 2 minute buffer time before considering it delayed
    estimatedTime.setMinutes(estimatedTime.getMinutes() + 2);
    isDelayed = new Date() > estimatedTime;
  }
  
  return {
    ...order,
    items: enrichedItems,
    isDelayed
  };
}

/**
 * Setup WebSocket server
 */
export function setupWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).substring(2, 15);
    clients.set(clientId, { ws });
    
    // Send initial active orders
    sendActiveOrders(ws);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Handle client registration
        if (data.type === 'register') {
          handleClientRegistration(clientId, ws, data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(clientId);
    });
  });
  
  return wss;
}

/**
 * Send active orders to a client
 */
async function sendActiveOrders(ws: WebSocket) {
  try {
    // Get all non-completed orders
    const activeOrders = await db.select().from(orders).where(
      and(
        eq(orders.status, 'NEW'),
        eq(orders.status, 'COOKING'),
        eq(orders.status, 'READY')
      )
    );
    
    // Enrich orders with items and delay status
    const enrichedOrders = await Promise.all(
      activeOrders.map(order => enrichOrder(order.id))
    );
    
    const message: WebSocketMessage = { 
      type: 'ordersUpdate', 
      data: enrichedOrders.filter(Boolean)
    };
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  } catch (error) {
    console.error('Error sending active orders:', error);
  }
}

/**
 * Handle client registration
 */
async function handleClientRegistration(clientId: string, ws: WebSocket, data: WebSocketMessage) {
  const registerMessage = data as any;
  const clientType = registerMessage.data.clientType;
  const bayId = registerMessage.data.bayId;
  
  // Store the client with its bay ID if provided
  if (bayId) {
    clients.set(clientId, { ws, bayId });
  }
  
  console.log(`Client registered as ${clientType}${bayId ? ` for bay ${bayId}` : ''}`);
}