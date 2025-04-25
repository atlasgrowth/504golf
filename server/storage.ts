import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  menuItems, type MenuItem, type InsertMenuItem,
  bays, type Bay, type InsertBay,
  orders, type Order, type InsertOrder, 
  orderItems, type OrderItem, type InsertOrderItem,
  type OrderWithItems, type OrderSummary, type Cart
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
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<OrderWithItems | undefined>;
  getOrdersByBayId(bayId: number): Promise<Order[]>;
  getActiveOrders(): Promise<OrderSummary[]>;
  getOrdersByStatus(status: string): Promise<OrderSummary[]>;
  createOrder(order: InsertOrder, cart: Cart): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItemStatus(id: number, completed: boolean): Promise<OrderItem | undefined>;
  
  // Initialize with sample data
  initializeData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private menuItems: Map<number, MenuItem>;
  private bays: Map<number, Bay>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private userIdCounter: number;
  private categoryIdCounter: number;
  private menuItemIdCounter: number;
  private bayIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private orderNumberCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.menuItems = new Map();
    this.bays = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.menuItemIdCounter = 1;
    this.bayIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.orderNumberCounter = 2300;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      (item) => item.categoryId === categoryId,
    );
  }

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemIdCounter++;
    const menuItem: MenuItem = { ...insertMenuItem, id };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }

  // Bays
  async getBays(): Promise<Bay[]> {
    return Array.from(this.bays.values());
  }

  async getBaysByFloor(floor: number): Promise<Bay[]> {
    return Array.from(this.bays.values()).filter(
      (bay) => bay.floor === floor,
    );
  }

  async getBayByNumber(number: number): Promise<Bay | undefined> {
    return Array.from(this.bays.values()).find(
      (bay) => bay.number === number,
    );
  }

  async getBayById(id: number): Promise<Bay | undefined> {
    return this.bays.get(id);
  }

  async createBay(insertBay: InsertBay): Promise<Bay> {
    const id = this.bayIdCounter++;
    const bay: Bay = { ...insertBay, id };
    this.bays.set(id, bay);
    return bay;
  }

  async updateBayStatus(id: number, status: string): Promise<Bay | undefined> {
    const bay = this.bays.get(id);
    if (!bay) return undefined;
    
    const updatedBay: Bay = { ...bay, status };
    this.bays.set(id, updatedBay);
    return updatedBay;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderWithItems(id: number): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const bay = this.bays.get(order.bayId);
    if (!bay) return undefined;
    
    const orderItemsList = Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === id,
    );
    
    const items = orderItemsList.map(item => {
      const menuItem = this.menuItems.get(item.menuItemId);
      if (!menuItem) throw new Error(`MenuItem with id ${item.menuItemId} not found`);
      return { ...item, menuItem };
    });
    
    return { ...order, bay, items };
  }

  async getOrdersByBayId(bayId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.bayId === bayId,
    );
  }

  async getActiveOrders(): Promise<OrderSummary[]> {
    const activeOrders = Array.from(this.orders.values()).filter(
      (order) => ['pending', 'preparing', 'ready'].includes(order.status)
    );
    
    return Promise.all(activeOrders.map(async (order) => {
      const bay = await this.getBayById(order.bayId);
      if (!bay) throw new Error(`Bay with id ${order.bayId} not found`);
      
      const orderItems = Array.from(this.orderItems.values()).filter(
        (item) => item.orderId === order.id,
      );
      
      const timeElapsed = Math.floor((Date.now() - order.createdAt.getTime()) / (1000 * 60));
      
      // Consider an order delayed if it's been more than 20 minutes since creation
      const isDelayed = timeElapsed > 20;
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        bayId: order.bayId,
        bayNumber: bay.number,
        floor: bay.floor,
        status: order.status,
        createdAt: order.createdAt,
        timeElapsed,
        totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        isDelayed,
      };
    }));
  }

  async getOrdersByStatus(status: string): Promise<OrderSummary[]> {
    const orders = Array.from(this.orders.values()).filter(
      (order) => order.status === status
    );
    
    return Promise.all(orders.map(async (order) => {
      const bay = await this.getBayById(order.bayId);
      if (!bay) throw new Error(`Bay with id ${order.bayId} not found`);
      
      const orderItems = Array.from(this.orderItems.values()).filter(
        (item) => item.orderId === order.id,
      );
      
      const timeElapsed = Math.floor((Date.now() - order.createdAt.getTime()) / (1000 * 60));
      const isDelayed = timeElapsed > 20;
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        bayId: order.bayId,
        bayNumber: bay.number,
        floor: bay.floor,
        status: order.status,
        createdAt: order.createdAt,
        timeElapsed,
        totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        isDelayed,
      };
    }));
  }

  async createOrder(insertOrder: InsertOrder, cart: Cart): Promise<Order> {
    const id = this.orderIdCounter++;
    const orderNumber = `ORD-${++this.orderNumberCounter}`;
    
    // Calculate estimated completion time based on menu items' prep times
    let maxPrepTime = 0;
    for (const item of cart.items) {
      const menuItem = await this.getMenuItemById(item.menuItemId);
      if (menuItem && menuItem.prepTime > maxPrepTime) {
        maxPrepTime = menuItem.prepTime;
      }
    }
    
    const now = new Date();
    const estimatedCompletionTime = new Date(now.getTime() + maxPrepTime * 60 * 1000);
    
    const order: Order = { 
      ...insertOrder, 
      id, 
      orderNumber,
      createdAt: now,
      estimatedCompletionTime,
      completedAt: null
    };
    
    this.orders.set(id, order);
    
    // Create order items
    for (const item of cart.items) {
      await this.createOrderItem({
        orderId: id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        notes: "",
      });
    }
    
    // Update bay status to active
    await this.updateBayStatus(order.bayId, "active");
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { 
      ...order, 
      status,
      completedAt: ['served', 'cancelled'].includes(status) ? new Date() : order.completedAt
    };
    
    this.orders.set(id, updatedOrder);
    
    // If order is served or cancelled, update bay status
    if (status === 'served' || status === 'cancelled') {
      // Check if this is the only active order for this bay
      const bayOrders = await this.getOrdersByBayId(order.bayId);
      const activeOrders = bayOrders.filter(o => 
        o.id !== id && ['pending', 'preparing', 'ready'].includes(o.status)
      );
      
      if (activeOrders.length === 0) {
        await this.updateBayStatus(order.bayId, "occupied");
      }
    }
    
    return updatedOrder;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId,
    );
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const orderItem: OrderItem = { ...insertOrderItem, id, completed: false };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  async updateOrderItemStatus(id: number, completed: boolean): Promise<OrderItem | undefined> {
    const orderItem = this.orderItems.get(id);
    if (!orderItem) return undefined;
    
    const updatedOrderItem: OrderItem = { ...orderItem, completed };
    this.orderItems.set(id, updatedOrderItem);
    
    // Check if all items in the order are completed
    const allItems = await this.getOrderItems(orderItem.orderId);
    const allCompleted = allItems.every(item => item.completed);
    
    // If all items are completed, update order status to ready
    if (allCompleted) {
      await this.updateOrderStatus(orderItem.orderId, "ready");
    }
    
    return updatedOrderItem;
  }

  // Initialize with sample data
  async initializeData(): Promise<void> {
    // Create sample users
    await this.createUser({
      username: "server",
      password: "password",
      role: "server",
    });
    
    await this.createUser({
      username: "kitchen",
      password: "password",
      role: "kitchen",
    });
    
    await this.createUser({
      username: "admin",
      password: "password",
      role: "admin",
    });
    
    // Create sample categories
    const starters = await this.createCategory({
      name: "Starters",
      slug: "starters",
    });
    
    const mains = await this.createCategory({
      name: "Mains",
      slug: "mains",
    });
    
    const drinks = await this.createCategory({
      name: "Drinks",
      slug: "drinks",
    });
    
    const desserts = await this.createCategory({
      name: "Desserts",
      slug: "desserts",
    });
    
    // Create sample menu items
    await this.createMenuItem({
      name: "Loaded Nachos",
      description: "Tortilla chips with cheese, jalapeños, and fresh guacamole",
      price: 1299,
      categoryId: starters.id,
      prepTime: 15,
      imageUrl: "https://images.unsplash.com/photo-1550388342-5699a3d6d602",
      active: true,
    });
    
    await this.createMenuItem({
      name: "Chicken Wings",
      description: "Crispy wings with your choice of sauce",
      price: 1499,
      categoryId: starters.id,
      prepTime: 12,
      imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f",
      active: true,
    });
    
    await this.createMenuItem({
      name: "Classic Burger",
      description: "Grass-fed beef, lettuce, tomato, and special sauce",
      price: 1599,
      categoryId: mains.id,
      prepTime: 12,
      imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add",
      active: true,
    });
    
    await this.createMenuItem({
      name: "Margherita Pizza",
      description: "Fresh mozzarella, tomato sauce, and basil",
      price: 1799,
      categoryId: mains.id,
      prepTime: 14,
      imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
      active: true,
    });
    
    await this.createMenuItem({
      name: "Caesar Salad",
      description: "Romaine lettuce, croutons, and Caesar dressing",
      price: 1299,
      categoryId: mains.id,
      prepTime: 5,
      imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
      active: true,
    });
    
    await this.createMenuItem({
      name: "Craft Beer",
      description: "Local IPA with citrus notes",
      price: 799,
      categoryId: drinks.id,
      prepTime: 1,
      imageUrl: "https://images.unsplash.com/photo-1576506295286-5cda18df43e7",
      active: true,
    });
    
    await this.createMenuItem({
      name: "Soda",
      description: "Refreshing carbonated drinks",
      price: 299,
      categoryId: drinks.id,
      prepTime: 1,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
      active: true,
    });
    
    await this.createMenuItem({
      name: "Chocolate Cake",
      description: "Rich and moist chocolate cake",
      price: 899,
      categoryId: desserts.id,
      prepTime: 5,
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
      active: true,
    });
    
    // Create sample bays
    for (let floor = 1; floor <= 3; floor++) {
      for (let bayNum = 1; bayNum <= 33; bayNum++) {
        const bayNumber = (floor - 1) * 33 + bayNum;
        await this.createBay({
          number: bayNumber,
          floor,
          status: "empty",
        });
      }
    }
    
    // Create sample orders
    const bay1 = await this.getBayByNumber(1);
    const bay3 = await this.getBayByNumber(3);
    const bay6 = await this.getBayByNumber(6);
    
    if (bay1 && bay3 && bay6) {
      // Create order for bay 6 (delayed)
      const order1 = await this.createOrder(
        {
          orderNumber: "ORD-2305",
          bayId: bay6.id,
          status: "preparing",
          orderType: "server",
          specialInstructions: "Extra sauce on wings, no cilantro on nachos",
        },
        {
          items: [
            { menuItemId: 1, name: "Loaded Nachos", price: 1299, quantity: 2 },
            { menuItemId: 6, name: "Craft Beer", price: 799, quantity: 3 },
            { menuItemId: 2, name: "Chicken Wings", price: 1499, quantity: 1 },
          ],
        }
      );
      
      // Manually change the creation time to simulate delayed order
      const delayedTime = new Date();
      delayedTime.setMinutes(delayedTime.getMinutes() - 25);
      this.orders.set(order1.id, { ...order1, createdAt: delayedTime });
      
      // Create order for bay 1 (in progress)
      const order2 = await this.createOrder(
        {
          orderNumber: "ORD-2306",
          bayId: bay1.id,
          status: "preparing",
          orderType: "customer",
          specialInstructions: "Medium-well burger, extra ketchup",
        },
        {
          items: [
            { menuItemId: 3, name: "Classic Burger", price: 1599, quantity: 1 },
            { menuItemId: 7, name: "Soda", price: 299, quantity: 2 },
          ],
        }
      );
      
      // Mark some items as completed
      const orderItems2 = await this.getOrderItems(order2.id);
      if (orderItems2.length >= 2) {
        await this.updateOrderItemStatus(orderItems2[0].id, true);
        await this.updateOrderItemStatus(orderItems2[1].id, true);
      }
      
      // Create order for bay 3 (almost ready)
      const order3 = await this.createOrder(
        {
          orderNumber: "ORD-2307",
          bayId: bay3.id,
          status: "preparing",
          orderType: "server",
          specialInstructions: "Dressing on the side for salads",
        },
        {
          items: [
            { menuItemId: 5, name: "Caesar Salad", price: 1299, quantity: 2 },
            { menuItemId: 4, name: "Margherita Pizza", price: 1799, quantity: 1 },
          ],
        }
      );
      
      // Manually change the creation time to simulate "almost ready" state
      const warningTime = new Date();
      warningTime.setMinutes(warningTime.getMinutes() - 18);
      this.orders.set(order3.id, { ...order3, createdAt: warningTime });
      
      // Mark some items as completed
      const orderItems3 = await this.getOrderItems(order3.id);
      if (orderItems3.length >= 2) {
        await this.updateOrderItemStatus(orderItems3[0].id, true);
      }
    }
  }
}

export const storage = new MemStorage();
// Initialize data
storage.initializeData();
