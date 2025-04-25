/**
 * Timer-related functionality for the kitchen management system
 * 
 * This module handles background tasks like automatically checking
 * for items that should be marked as ready based on their timer.
 */

import { storage } from './storage';
import { OrderItemStatus } from '../packages/shared/src/schema';
import { broadcastUpdate, sendBayUpdate } from './ws';
import { toOrderItemDTO } from './dto';
import { ItemReadyMessage } from '../packages/shared/src/types';

/**
 * Check for items that are cooking and should be ready
 * Called periodically by the timer
 */
export async function checkCookingItems() {
  try {
    // Get all currently cooking items from the database
    const cookingItems = await storage.getOrderItemsByStation('*', OrderItemStatus.COOKING);
    const now = new Date();
    
    for (const item of cookingItems) {
      // Check if item has a readyAt timestamp and it's in the past
      if (item.readyAt && new Date(item.readyAt) <= now) {
        console.log(`Item ${item.id} should be marked as ready based on timer`);
        
        // Mark the item as ready
        const updatedItem = await storage.markOrderItemReady(item.id);
        
        if (updatedItem) {
          // Get the order to send bay info
          const order = await storage.getOrderById(updatedItem.orderId);
          
          if (order) {
            // Get bay info
            const bay = await storage.getBayById(order.bayId);
            
            // Calculate elapsed time in seconds
            const firedTime = updatedItem.firedAt ? new Date(updatedItem.firedAt).getTime() : Date.now();
            const readyTime = updatedItem.readyAt ? new Date(updatedItem.readyAt).getTime() : Date.now();
            const elapsedSeconds = Math.floor((readyTime - firedTime) / 1000);
            
            // Create properly typed item ready message
            const itemReadyMessage: ItemReadyMessage = {
              type: 'item_ready',
              data: {
                orderId: updatedItem.orderId,
                orderItem: toOrderItemDTO(updatedItem),
                station: updatedItem.station || '',
                readyAt: updatedItem.readyAt ? updatedItem.readyAt.toISOString() : new Date().toISOString(),
                elapsedSeconds,
                bayId: order.bayId,
                bayNumber: bay?.number || order.bayId,
                status: 'READY'
              }
            };
            
            // Broadcast to all kitchen clients
            broadcastUpdate('item_ready', itemReadyMessage.data);
            
            // Send update to the specific bay
            sendBayUpdate(order.bayId, 'item_ready', itemReadyMessage.data);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking cooking items:', error);
  }
}

/**
 * Start the background timer process
 */
export function startTimers() {
  console.log('Starting kitchen timer background tasks...');
  
  // Check cooking items every 5 seconds
  setInterval(checkCookingItems, 5000);
}