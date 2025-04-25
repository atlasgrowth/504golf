import { Cart, OrderSummary, Order, OrderItem, MenuItem, Bay } from '../../shared/schema';

// WebSocket Message Types
export type WebSocketMessageType = 
  | 'register' 
  | 'order_created' 
  | 'order_updated' 
  | 'order_item_updated'
  | 'bay_updated';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
}

export interface OrderCreatedMessage {
  type: 'order_created';
  data: {
    order: Order;
    bayNumber: number;
    totalItems: number;
    estimatedCompletionTime?: number; // In minutes
    station?: string; // e.g., "grill", "bar", "kitchen"
  };
}

export interface OrderUpdatedMessage {
  type: 'order_updated';
  data: {
    order: Order;
    bayNumber: number;
    status: string;
    estimatedCompletionTime?: number; // In minutes
    timeElapsed?: number; // Time since creation in minutes
    isDelayed?: boolean;
  };
}

export interface OrderItemUpdatedMessage {
  type: 'order_item_updated';
  data: {
    orderItem: OrderItem;
    menuItem: MenuItem;
    orderId: string;
    completed: boolean;
    estimatedCompletionTime?: number; // In minutes
    station?: string; // e.g., "grill", "bar", "kitchen"
  };
}

export interface BayUpdatedMessage {
  type: 'bay_updated';
  data: {
    bay: Bay;
    status: string;
  };
}

export interface RegisterMessage {
  type: 'register';
  data: {
    clientType: 'guest' | 'server' | 'kitchen';
    bayId?: number;
  };
}