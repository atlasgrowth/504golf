import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertOrderSchema, type Cart
} from "../shared/schema";
import {
  WebSocketMessage, WebSocketMessageType, 
  OrderCreatedMessage, OrderUpdatedMessage, OrderItemUpdatedMessage
} from "../shared/types";
import { 
  toMenuItemDTO, toOrderDTO, toOrderItemDTO, toBayDTO, toCategoryDTO 
} from "./dto";

// WebSocket clients
const clients = new Map<string, { ws: WebSocket, clientType?: 'kitchen' | 'server' | 'guest', bayId?: number }>();

// Send update to all connected clients
function broadcastUpdate(type: WebSocketMessageType, data: any) {
  const message: WebSocketMessage = { type, data };
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Send update to clients for a specific bay
function sendBayUpdate(bayId: number, type: WebSocketMessageType, data: any) {
  const message: WebSocketMessage = { type, data };
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN && client.bayId === bayId) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).substring(2, 15);
    clients.set(clientId, { ws });
    
    // Send initial data
    storage.getActiveOrders().then(orders => {
      const message: WebSocketMessage = { 
        type: 'ordersUpdate', 
        data: orders 
      };
      ws.send(JSON.stringify(message));
    });
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Handle client registration - normalized approach
        if (data.type === 'register') {
          const registerData = data as ClientRegistrationMessage;
          const clientType = registerData.data.clientType;
          const bayId = registerData.data.bayId;
          
          // Store the client info including type and bay ID if provided
          clients.set(clientId, { ws, clientType, bayId });
          
          // Auto-subscribe guests and servers to their bay
          if (bayId && (clientType === 'guest' || clientType === 'server')) {
            // Send current bay orders
            const bay = await storage.getBayById(bayId);
            if (bay) {
              const orders = await storage.getOrdersByBayId(bayId);
              const bayMessage: BayUpdatedMessage = {
                type: 'bay_updated',
                data: { 
                  bay: toBayDTO(bay), 
                  orders: orders.map(toOrderDTO),
                  status: bay.status
                }
              };
              ws.send(JSON.stringify(bayMessage));
            }
          }
          
          console.log(`Client registered as ${clientType}${bayId ? ` for bay ${bayId}` : ''}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(clientId);
    });
  });
  
  // API Routes - prefix all with /api
  app.get('/api/menu', async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      const menuItems = await storage.getMenuItems();
      
      // Group menu items by category
      const menu = categories.map(category => {
        const items = menuItems
          .filter(item => item.category === category.name)
          .map(toMenuItemDTO);
        return { 
          category: toCategoryDTO(category), 
          items 
        };
      });
      
      res.json(menu);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch menu' });
    }
  });
  
  app.get('/api/menu/:categorySlug', async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      const category = categories.find(c => c.slug === req.params.categorySlug);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      const items = await storage.getMenuItemsByCategory(category.id);
      res.json(items.map(toMenuItemDTO));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch menu items' });
    }
  });
  
  app.get('/api/bays', async (req: Request, res: Response) => {
    try {
      const floor = req.query.floor ? parseInt(req.query.floor as string) : undefined;
      const status = req.query.status as string | undefined;
      
      let bays = await storage.getBays();
      
      if (floor) {
        bays = bays.filter(bay => bay.floor === floor);
      }
      
      if (status && status !== 'all') {
        bays = bays.filter(bay => bay.status === status);
      }
      
      res.json(bays.map(toBayDTO));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bays' });
    }
  });
  
  app.get('/api/bay/:number', async (req: Request, res: Response) => {
    try {
      const bayNumber = parseInt(req.params.number);
      const bay = await storage.getBayByNumber(bayNumber);
      
      if (!bay) {
        return res.status(404).json({ message: 'Bay not found' });
      }
      
      res.json(toBayDTO(bay));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bay' });
    }
  });
  
  app.get('/api/orders', async (_req: Request, res: Response) => {
    try {
      const orders = await storage.getActiveOrders();
      // OrderSummary objects are already in camelCase format
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });
  
  app.get('/api/orders/:status', async (req: Request, res: Response) => {
    try {
      const status = req.params.status;
      
      if (!['pending', 'preparing', 'ready', 'served', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid order status' });
      }
      
      const orders = await storage.getOrdersByStatus(status);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });
  
  app.get('/api/order/:id', async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await storage.getOrderWithItems(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // OrderWithItems already has the correct structure from storage
      // but we can ensure consistency with DTO format if needed
      const orderDTO = {
        ...toOrderDTO(order),
        items: order.items.map(item => ({
          ...toOrderItemDTO(item),
          menuItem: toMenuItemDTO(item.menuItem)
        })),
        bay: toBayDTO(order.bay)
      };
      
      res.json(orderDTO);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  });
  
  // Create new order
  const createOrderSchema = z.object({
    order: insertOrderSchema,
    cart: z.object({
      items: z.array(z.object({
        menuItemId: z.string(),
        name: z.string(),
        priceCents: z.number(),
        quantity: z.number(),
        station: z.string().optional(), // Added for P2
      })),
      specialInstructions: z.string().optional(),
    }),
  });
  
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const { order, cart } = validatedData;
      
      // Calculate estimated completion time based on order items and their complexity
      // A simple algorithm: 5 min base time + 2 min per item
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const estimatedMinutes = 5 + Math.ceil(totalItems * 2);
      const estimatedCompletionTime = new Date();
      estimatedCompletionTime.setMinutes(estimatedCompletionTime.getMinutes() + estimatedMinutes);
      
      // Add estimatedCompletionTime to order data
      const orderWithEstimatedTime = {
        ...order,
        estimatedCompletionTime
      };
      
      // Create the order
      const newOrder = await storage.createOrder(orderWithEstimatedTime, cart);
      
      // Broadcast update to all clients
      const updatedOrders = await storage.getActiveOrders();
      broadcastUpdate('ordersUpdate', updatedOrders);
      
      // Create a properly typed order created message
      const orderCreatedMessage: OrderCreatedMessage = {
        type: 'order_created',
        data: {
          order: toOrderDTO(newOrder),
          estimatedCompletionTime: estimatedCompletionTime.toISOString(),
          stations: cart.items.reduce((stationMap, item) => {
            const station = item.station || 'main';
            if (!stationMap[station]) {
              stationMap[station] = [];
            }
            stationMap[station].push({
              menuItemId: item.menuItemId,
              name: item.name,
              quantity: item.quantity
            });
            return stationMap;
          }, {} as Record<string, { menuItemId: string, name: string, quantity: number }[]>)
        }
      };
      
      // Send update to the specific bay
      sendBayUpdate(order.bayId, 'order_created', orderCreatedMessage.data);
      
      res.status(201).json(toOrderDTO(newOrder));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid order data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create order' });
    }
  });
  
  // Update order status
  const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'preparing', 'ready', 'served', 'cancelled']),
  });
  
  app.put('/api/order/:id/status', async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id;
      const { status } = updateOrderStatusSchema.parse(req.body);
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Get the full order with items
      const fullOrder = await storage.getOrderWithItems(orderId);
      
      // Broadcast update to all connected clients
      const updatedOrders = await storage.getActiveOrders();
      broadcastUpdate('ordersUpdate', updatedOrders);
      
      if (fullOrder) {
        // Create properly typed order updated message
        const orderUpdatedMessage: OrderUpdatedMessage = {
          type: 'order_updated',
          data: {
            order: toOrderDTO(updatedOrder),
            items: fullOrder.items.map(item => toOrderItemDTO(item)),
            status,
            // Calculate time elapsed since order creation
            timeElapsed: Math.round((Date.now() - new Date(fullOrder.createdAt).getTime()) / 60000), // in minutes
            estimatedCompletionTime: fullOrder.estimatedCompletionTime 
              ? new Date(fullOrder.estimatedCompletionTime).toISOString() 
              : null,
            // For 'ready' and 'served' statuses, include completion info
            completionTime: ['ready', 'served'].includes(status) ? new Date().toISOString() : null,
            isDelayed: fullOrder.estimatedCompletionTime 
              ? new Date() > new Date(fullOrder.estimatedCompletionTime) 
              : false
          }
        };
        
        // Send update to the specific bay
        sendBayUpdate(updatedOrder.bayId, 'order_updated', orderUpdatedMessage.data);
      }
      
      res.json(toOrderDTO(updatedOrder));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid status', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });
  
  // Update order item completion status
  const updateOrderItemStatusSchema = z.object({
    completed: z.boolean(),
  });
  
  app.put('/api/orderitem/:id/status', async (req: Request, res: Response) => {
    try {
      const orderItemId = req.params.id;
      const { completed } = updateOrderItemStatusSchema.parse(req.body);
      
      const updatedOrderItem = await storage.updateOrderItemStatus(orderItemId, completed);
      
      if (!updatedOrderItem) {
        return res.status(404).json({ message: 'Order item not found' });
      }
      
      // Get the full order to send updated data
      const order = await storage.getOrderWithItems(updatedOrderItem.orderId);
      
      if (order) {
        // Get all order items for this order
        const orderItems = await storage.getOrderItems(order.id);
        
        // Check if all items are completed
        const allItemsCompleted = orderItems.every(item => item.completed);
        
        // If all items are completed, update the order status to 'ready' if it's currently 'preparing'
        let updatedOrderStatus = order.status;
        if (allItemsCompleted && order.status === 'preparing') {
          const readyOrder = await storage.updateOrderStatus(order.id, 'ready');
          if (readyOrder) {
            updatedOrderStatus = 'ready';
          }
        }
        
        // Broadcast update to all clients
        const updatedOrders = await storage.getActiveOrders();
        broadcastUpdate('ordersUpdate', updatedOrders);
        
        // Create a properly typed order item update message
        const orderItemUpdateMessage: OrderItemUpdatedMessage = {
          type: 'order_item_updated',
          data: {
            orderId: order.id,
            orderItem: toOrderItemDTO(updatedOrderItem),
            orderStatus: updatedOrderStatus,
            allItemsCompleted,
            // Calculate time elapsed since order creation
            timeElapsed: Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000), // in minutes
            estimatedCompletionTime: order.estimatedCompletionTime 
              ? new Date(order.estimatedCompletionTime).toISOString() 
              : null
          }
        };
        
        // Send update to the specific bay
        sendBayUpdate(order.bayId, 'order_item_updated', orderItemUpdateMessage.data);
      }
      
      res.json(toOrderItemDTO(updatedOrderItem));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid status', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to update order item status' });
    }
  });
  
  return httpServer;
}
