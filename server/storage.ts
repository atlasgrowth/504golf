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

// Re-export the DatabaseStorage implementation
import { DatabaseStorage } from "./storage.db";
export const storage = new DatabaseStorage();