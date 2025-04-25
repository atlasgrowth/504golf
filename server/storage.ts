import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  menuItems, type MenuItem, type InsertMenuItem,
  bays, type Bay, type InsertBay,
  orders, type Order, type InsertOrder, 
  orderItems, type OrderItem, type InsertOrderItem,
  type OrderWithItems, type OrderSummary, type Cart,
  OrderItemStatus, OrderStatus
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  getMenuItemById(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  
  // Bays
  getBays(): Promise<Bay[]>;
  getBaysByFloor(floor: number): Promise<Bay[]>;
  getBayByNumber(number: number): Promise<Bay | undefined>;
  getBayById(id: number): Promise<Bay | undefined>;
  createBay(bay: InsertBay): Promise<Bay>;
  updateBayStatus(id: number, status: string): Promise<Bay | undefined>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderWithItems(id: string): Promise<OrderWithItems | undefined>;
  getOrdersByBayId(bayId: number): Promise<Order[]>;
  getActiveOrders(): Promise<OrderSummary[]>;
  getOrdersByStatus(status: string): Promise<OrderSummary[]>;
  createOrder(order: InsertOrder, cart: Cart): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Legacy method (to be deprecated) - updates completed flag
  updateOrderItemStatus(id: string, completed: boolean): Promise<OrderItem | undefined>;
  
  // Methods to support enhanced status tracking
  markFired(id: string): Promise<OrderItem | undefined>;
  markReady(id: string): Promise<OrderItem | undefined>;
  markDelivered(id: string): Promise<OrderItem | undefined>;
  autoFlipReady(): Promise<OrderItem[]>;
  
  // New methods for enhanced status tracking
  fireOrderItem(id: string): Promise<OrderItem | undefined>; // Sets status to COOKING and captures firedAt timestamp
  markOrderItemReady(id: string): Promise<OrderItem | undefined>; // Sets status to READY
  markOrderItemDelivered(id: string): Promise<OrderItem | undefined>; // Sets status to DELIVERED and timestamps
  getOrderItemsByStation(station: string, status?: string): Promise<OrderItem[]>; // Filtered by station and optional status
  
  // Initialize with sample data
  initializeData(): Promise<void>;
}

// Import database instance and helpers
import { db, pool } from "./db";
import { eq, asc, desc, and, or, isNotNull, isNull, lt } from "drizzle-orm";

// Implement the Database Storage
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems);
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    const category = await this.getCategoryById(categoryId);
    if (!category) return [];
    
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.category, category.name));
  }

  async getMenuItemById(id: string | number): Promise<MenuItem | undefined> {
    const idString = typeof id === 'number' ? id.toString() : id;
    try {
      const [menuItem] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, idString));
      return menuItem || undefined;
    } catch (error) {
      console.error(`Error fetching menu item with ID ${idString}:`, error);
      return undefined;
    }
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const [newMenuItem] = await db
      .insert(menuItems)
      .values(menuItem)
      .returning();
    return newMenuItem;
  }

  // Bays
  async getBays(): Promise<Bay[]> {
    return db
      .select()
      .from(bays)
      .orderBy(asc(bays.floor), asc(bays.number));
  }

  async getBaysByFloor(floor: number): Promise<Bay[]> {
    return db
      .select()
      .from(bays)
      .where(eq(bays.floor, floor))
      .orderBy(asc(bays.number));
  }

  async getBayByNumber(number: number): Promise<Bay | undefined> {
    const [bay] = await db
      .select()
      .from(bays)
      .where(eq(bays.number, number));
    return bay || undefined;
  }

  async getBayById(id: number): Promise<Bay | undefined> {
    const [bay] = await db
      .select()
      .from(bays)
      .where(eq(bays.id, id));
    return bay || undefined;
  }

  async createBay(bay: InsertBay): Promise<Bay> {
    const [newBay] = await db
      .insert(bays)
      .values(bay)
      .returning();
    return newBay;
  }

  async updateBayStatus(id: number, status: string): Promise<Bay | undefined> {
    const [updatedBay] = await db
      .update(bays)
      .set({ status })
      .where(eq(bays.id, id))
      .returning();
    return updatedBay || undefined;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderWithItems(id: string): Promise<OrderWithItems | undefined> {
    try {
      const order = await this.getOrderById(id);
      if (!order) {
        console.warn(`Order not found with ID: ${id}`);
        return undefined;
      }

      const bay = await this.getBayById(order.bayId);
      if (!bay) {
        console.warn(`Bay not found for order ${id} with bay ID: ${order.bayId}`);
        return undefined;
      }

      const orderItemsList = await this.getOrderItems(id);
      
      // Fetch menu items for each order item - don't convert menuItemId to number
      const items = await Promise.all(
        orderItemsList.map(async (item) => {
          try {
            const menuItem = await this.getMenuItemById(item.menuItemId);
            // Handle case where menuItem might be undefined
            return { 
              ...item, 
              menuItem: menuItem || {
                id: item.menuItemId,
                name: 'Unknown Item',
                description: 'Item details unavailable',
                price: 0,
                category: 'Unknown',
                station: item.station || 'Unknown',
                cookMinutes: 5
              }
            };
          } catch (error) {
            console.error(`Error fetching menu item for order item ${item.id}:`, error);
            // Return the order item with a placeholder menu item on error
            return { 
              ...item, 
              menuItem: {
                id: item.menuItemId,
                name: 'Error: Item Unavailable',
                description: 'Could not retrieve item details',
                price: 0,
                category: 'Unknown',
                station: item.station || 'Unknown',
                cookMinutes: 5
              }
            };
          }
        })
      );

      return {
        ...order,
        bay,
        items,
      };
    } catch (error) {
      console.error(`Error getting order with items for ID ${id}:`, error);
      return undefined;
    }
  }

  async getOrdersByBayId(bayId: number): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.bayId, bayId))
      .orderBy(desc(orders.createdAt));
  }

  async getActiveOrders(): Promise<OrderSummary[]> {
    // Active orders are ones that are not SERVED or CANCELLED
    const activeOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          or(
            eq(orders.status, "NEW"),
            eq(orders.status, "COOKING"),
            eq(orders.status, "READY")
          )
        )
      )
      .orderBy(asc(orders.createdAt));

    const summaries = await Promise.all(
      activeOrders.map(async (order) => {
        const bay = await this.getBayById(order.bayId);
        const items = await this.getOrderItems(order.id);
        
        // Calculate how many minutes ago the order was created
        const now = new Date();
        const createdAt = new Date(order.createdAt);
        const timeElapsed = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
        
        // Determine if the order is delayed
        // For simplicity, we'll consider an order delayed if it's been more than 15 minutes since creation
        const isDelayed = timeElapsed > 15;
        
        return {
          id: order.id,
          orderNumber: `#${order.id.substring(0, 6)}`, // Generate order number from ID
          bayId: order.bayId,
          bayNumber: bay?.number,
          floor: bay?.floor || 0,
          status: order.status,
          createdAt: order.createdAt,
          timeElapsed,
          totalItems: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
          isDelayed,
        };
      })
    );

    return summaries;
  }

  async getOrdersByStatus(status: string): Promise<OrderSummary[]> {
    const ordersWithStatus = await db
      .select()
      .from(orders)
      .where(eq(orders.status, status.toUpperCase()))
      .orderBy(asc(orders.createdAt));

    const summaries = await Promise.all(
      ordersWithStatus.map(async (order) => {
        const bay = await this.getBayById(order.bayId);
        const items = await this.getOrderItems(order.id);
        
        // Calculate how many minutes ago the order was created
        const now = new Date();
        const createdAt = new Date(order.createdAt);
        const timeElapsed = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
        
        // Determine if the order is delayed (assuming a 15-minute threshold)
        const isDelayed = timeElapsed > 15;
        
        return {
          id: order.id,
          orderNumber: `#${order.id.substring(0, 6)}`, // Generate order number from ID
          bayId: order.bayId,
          bayNumber: bay?.number,
          floor: bay?.floor || 0,
          status: order.status,
          createdAt: order.createdAt,
          timeElapsed,
          totalItems: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
          isDelayed,
        };
      })
    );

    return summaries;
  }

  async createOrder(order: InsertOrder, cart: Cart): Promise<Order> {
    // First, create the order
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();

    // Then create order items from the cart
    for (const item of cart.items) {
      // Look up the menu item to get its station
      let station = item.station;
      let cookSeconds = null;
      
      // If station isn't provided in the cart item, get it from the menu item
      if (!station) {
        const menuItem = await this.getMenuItemById(item.menuItemId);
        station = menuItem?.station;
        // Set cook seconds based on prep time from menu item
        if (menuItem && menuItem.prep_seconds) {
          cookSeconds = menuItem.prep_seconds;
        }
      }
      
      // Use direct SQL approach with the pool to handle the column name difference
      await pool.query(
        `INSERT INTO order_items (order_id, menu_item_id, qty, notes, station, cook_seconds) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          newOrder.id,
          item.menuItemId,
          item.quantity,
          cart.specialInstructions || null,
          station || null,
          cookSeconds || 300 // Default to 5 minutes if not available
        ]
      );
    }

    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status: status.toUpperCase() })
      .where(eq(orders.id, id))
      .returning();
    
    return updatedOrder || undefined;
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db
      .insert(orderItems)
      .values(orderItem)
      .returning();
    return newOrderItem;
  }

  async updateOrderItemStatus(id: string, completed: boolean): Promise<OrderItem | undefined> {
    const [updatedOrderItem] = await db
      .update(orderItems)
      .set({ 
        completed,
        // Also update status based on completed flag for backward compatibility
        status: completed ? OrderItemStatus.DELIVERED : OrderItemStatus.NEW,
        // Set deliveredAt timestamp if completed=true
        deliveredAt: completed ? new Date() : null
      })
      .where(eq(orderItems.id, id))
      .returning();
    
    return updatedOrderItem || undefined;
  }

  // New methods for enhanced status tracking
  async fireOrderItem(id: string): Promise<OrderItem | undefined> {
    const now = new Date();
    
    // Get the order item to calculate readyAt
    const [orderItem] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));
    
    if (!orderItem) return undefined;
    
    // Get the menu item to ensure we have the station
    const menuItem = await this.getMenuItemById(orderItem.menuItemId);
    const station = orderItem.station || (menuItem ? menuItem.station : null);
    
    // Calculate readyAt time based on firedAt + cookSeconds (default 5 min/300 sec if not set)
    const readyAt = new Date(now);
    readyAt.setSeconds(readyAt.getSeconds() + (orderItem.cookSeconds || 300));
    
    // Update the order item
    const [updatedOrderItem] = await db
      .update(orderItems)
      .set({
        status: OrderItemStatus.COOKING,
        firedAt: now,
        readyAt: readyAt,
        station: station, // Set the station from menu item if not already set
        completed: false // Reset completed flag in case it was set
      })
      .where(eq(orderItems.id, id))
      .returning();
    
    // Update parent order status to COOKING if needed
    if (updatedOrderItem) {
      // Get the order
      const order = await this.getOrderById(updatedOrderItem.orderId);
      if (order && order.status !== OrderStatus.COOKING) {
        // Update order status to cooking
        await this.updateOrderStatus(order.id, OrderStatus.COOKING);
      }
    }
    
    return updatedOrderItem || undefined;
  }
  
  // Helper to get station by menu item ID
  private async getMenuItemStationById(menuItemId: string): Promise<string | null> {
    try {
      const menuItem = await this.getMenuItemById(menuItemId);
      return menuItem?.station || null;
    } catch (error) {
      console.error(`Error fetching station for menu item ${menuItemId}:`, error);
      return null;
    }
  }

  async markOrderItemReady(id: string): Promise<OrderItem | undefined> {
    const now = new Date();
    
    // Get the order item to ensure we have the station
    const [orderItem] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));
    
    if (!orderItem) return undefined;
    
    // Get the menu item to ensure we have the station
    const menuItem = await this.getMenuItemById(orderItem.menuItemId);
    const station = orderItem.station || (menuItem ? menuItem.station : null);
    
    // Update the order item
    const [updatedOrderItem] = await db
      .update(orderItems)
      .set({
        status: OrderItemStatus.READY,
        readyAt: now, // Update the actual ready time
        station: station // Ensure station is set
      })
      .where(eq(orderItems.id, id))
      .returning();
    
    // Update parent order status if appropriate
    if (updatedOrderItem) {
      // Check if all items in the order are READY or DELIVERED
      await this.updateOrderStatusBasedOnItems(updatedOrderItem.orderId);
    }
    
    return updatedOrderItem || undefined;
  }
  
  // Check all order items and update order status accordingly
  private async updateOrderStatusBasedOnItems(orderId: string): Promise<void> {
    // Get all order items for this order
    const items = await this.getOrderItems(orderId);
    
    // No items, nothing to do
    if (items.length === 0) return;
    
    // If any item is cooking, the order is cooking
    const hasCookingItems = items.some(item => item.status === OrderItemStatus.COOKING);
    if (hasCookingItems) {
      await this.updateOrderStatus(orderId, OrderStatus.COOKING);
      return;
    }
    
    // If all items are READY or DELIVERED, and at least one is READY, order is READY
    const allReadyOrDelivered = items.every(item => 
      item.status === OrderItemStatus.READY || 
      item.status === OrderItemStatus.DELIVERED
    );
    const hasReadyItems = items.some(item => item.status === OrderItemStatus.READY);
    
    if (allReadyOrDelivered && hasReadyItems) {
      await this.updateOrderStatus(orderId, OrderStatus.READY);
      return;
    }
    
    // If all items are DELIVERED, order is SERVED
    const allDelivered = items.every(item => item.status === OrderItemStatus.DELIVERED);
    if (allDelivered) {
      await this.updateOrderStatus(orderId, OrderStatus.SERVED);
      return;
    }
  }

  async markOrderItemDelivered(id: string): Promise<OrderItem | undefined> {
    const now = new Date();
    
    // Get the order item to ensure we have the station
    const [orderItem] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));
    
    if (!orderItem) return undefined;
    
    // Get the menu item to ensure we have the station
    const menuItem = await this.getMenuItemById(orderItem.menuItemId);
    const station = orderItem.station || (menuItem ? menuItem.station : null);
    
    // Update the order item
    const [updatedOrderItem] = await db
      .update(orderItems)
      .set({
        status: OrderItemStatus.DELIVERED,
        deliveredAt: now,
        station: station, // Ensure station is set
        completed: true // Maintain backward compatibility
      })
      .where(eq(orderItems.id, id))
      .returning();
    
    // Update parent order status if appropriate
    if (updatedOrderItem) {
      // Check if all items in the order are delivered
      await this.updateOrderStatusBasedOnItems(updatedOrderItem.orderId);
    }
    
    return updatedOrderItem || undefined;
  }
  
  // New convenience methods with shorter names for the workflow script
  async markFired(id: string): Promise<OrderItem | undefined> {
    return this.fireOrderItem(id);
  }
  
  async markReady(id: string): Promise<OrderItem | undefined> {
    return this.markOrderItemReady(id);
  }
  
  async markDelivered(id: string): Promise<OrderItem | undefined> {
    return this.markOrderItemDelivered(id);
  }
  
  // Automatically find and mark items as ready that have exceeded their cook time
  async autoFlipReady(): Promise<OrderItem[]> {
    const now = new Date();
    
    // Use direct SQL query to avoid Drizzle ORM operator issues
    const { rows: readyItems } = await pool.query(`
      SELECT * FROM order_items 
      WHERE status = 'COOKING' 
      AND ready_at IS NOT NULL 
      AND ready_at <= NOW()
    `);
    
    console.log(`Found ${readyItems.length} items to mark as ready`);
    
    const results: OrderItem[] = [];
    
    // Process each item
    for (const item of readyItems) {
      try {
        // Mark it as ready automatically
        const updatedItem = await this.markOrderItemReady(item.id);
        if (updatedItem) {
          results.push(updatedItem);
        }
      } catch (error) {
        console.error(`Error marking item ${item.id} as ready:`, error);
      }
    }
    
    return results;
  }

  async getOrderItemsByStation(station: string, status?: string): Promise<OrderItem[]> {
    if (status) {
      return db
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.station, station),
            // Use the string value directly rather than enum comparison
            eq(orderItems.status, status as any)
          )
        )
        .orderBy(asc(orderItems.firedAt)); // Sort by fire time if applicable
    } else {
      return db
        .select()
        .from(orderItems)
        .where(eq(orderItems.station, station))
        .orderBy(asc(orderItems.firedAt)); // Sort by fire time if applicable
    }
  }

  // Initialize with sample data
  async initializeData(): Promise<void> {
    // This method is for development/testing purposes
    // In a production app, you'd typically have migrations and seed scripts
    console.log("Database already initialized!");
  }
}

export const storage = new DatabaseStorage();