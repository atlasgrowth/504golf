// Shared types across applications
import { z } from 'zod';

// WebSocket message types
export type WebSocketMessage = {
  type: string;
  data: any;
};

// Cart related types
export type CartItem = {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  specialInstructions?: string;
};

// Order summary for display purposes
export type OrderSummary = {
  id: string;
  bayId: number;
  bayNumber?: number;
  floor: number;
  status: string;
  createdAt: Date;
  timeElapsed: number; // minutes since creation
  totalItems: number;
  isDelayed: boolean;
  estimatedCompletionTime?: Date; // New field for P2
  station?: string; // New field for P2
};