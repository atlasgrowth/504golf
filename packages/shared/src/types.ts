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
  | "bay_updated"
  | "item_new"
  | "item_cooking"
  | "item_ready"
  | "item_delivered";

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

/**
 * Item cooking message - sent when an item is fired (starts cooking)
 */
export interface ItemCookingMessage extends WebSocketMessage {
  type: "item_cooking";
  data: {
    orderId: string;
    orderItem: OrderItem;
    station: string;
    firedAt: string;
    cookSeconds: number;
    readyAt: string;
    bayId: number;
    bayNumber: number;
    status: string;
  };
}

/**
 * Item ready message - sent when an item is ready to be delivered
 */
export interface ItemReadyMessage extends WebSocketMessage {
  type: "item_ready";
  data: {
    orderId: string;
    orderItem: OrderItem;
    station: string;
    readyAt: string;
    elapsedSeconds: number;
    bayId: number;
    bayNumber: number;
    status: string;
  };
}

/**
 * Item delivered message - sent when an item is delivered to customer
 */
export interface ItemDeliveredMessage extends WebSocketMessage {
  type: "item_delivered";
  data: {
    orderId: string;
    orderItem: OrderItem;
    station: string;
    deliveredAt: string;
    totalCookTime: number;
    bayId: number;
    bayNumber: number;
    status: string;
  };
}