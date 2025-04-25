export * from './types';

// Directly export WebSocketMessage interface
export interface WebSocketMessage {
  type: string;
  data: any;
}