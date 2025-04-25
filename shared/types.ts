import { Order, OrderItem, Bay } from "./schema";

/**
 * Possible WebSocket message types used by the application
 */
export type WebSocketMessageType = 
  | "connect"
  | "register" 
  | "ordersUpdate"
  | "orderStatusUpdate"  
  | "order_created"
  | "order_updated"
  | "order_item_updated"
  | "bay_updated";

/**
 * Base WebSocket message interface
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
}

/**
 * Client registration message
 */
export interface ClientRegistrationMessage extends WebSocketMessage {
  type: "register";
  data: {
    clientType: "guest" | "server" | "kitchen";
    bayId?: number;
  };
}

/**
 * Order created message with station information
 */
export interface OrderCreatedMessage extends WebSocketMessage {
  type: "order_created";
  data: {
    order: Order;
    estimatedCompletionTime: string;
    stations: Record<string, { menuItemId: string, name: string, quantity: number }[]>;
  };
}

/**
 * Order updated message with timing information
 */
export interface OrderUpdatedMessage extends WebSocketMessage {
  type: "order_updated";
  data: {
    order: Order;
    items: OrderItem[];
    status: string;
    timeElapsed: number;
    estimatedCompletionTime: string | null;
    completionTime: string | null;
    isDelayed: boolean;
  };
}

/**
 * Order item updated message
 */
export interface OrderItemUpdatedMessage extends WebSocketMessage {
  type: "order_item_updated";
  data: {
    orderId: string;
    orderItem: OrderItem;
    orderStatus: string;
    allItemsCompleted: boolean;
    timeElapsed: number;
    estimatedCompletionTime: string | null;
  };
}

/**
 * Bay updated message
 */
export interface BayUpdatedMessage extends WebSocketMessage {
  type: "bay_updated";
  data: {
    bay: Bay;
    orders: Order[];
    status: string;
  };
}