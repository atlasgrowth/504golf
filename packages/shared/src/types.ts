import { 
  User, InsertUser, 
  Category, InsertCategory,
  MenuItem, InsertMenuItem,
  Bay, InsertBay,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  OrderWithItems, OrderSummary, Cart, CartItem
} from '../../../shared/schema';

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
}

// Re-export all schema types
export type {
  User, InsertUser,
  Category, InsertCategory,
  MenuItem, InsertMenuItem,
  Bay, InsertBay,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  OrderWithItems, OrderSummary, Cart, CartItem
};