/**
 * Timer-related functionality for the kitchen management system
 * 
 * This module handles background tasks like automatically checking
 * for items that should be marked as ready based on their timer.
 */

import { storage } from './storage';
import { broadcastUpdate, sendBayUpdate } from './ws';
import { toOrderItemDTO } from './dto';
import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Check for items that are cooking and should be ready
 * Called periodically by the timer
 */
export async function checkCookingItems() {
  try {
    console.log('Checking for items that need to be marked as ready...');
    
    // Use the autoFlipReady method from storage
    const flippedItems = await storage.autoFlipReady();
    
    console.log(`Found ${flippedItems.length} items that should be marked as ready`);
    
    // Send notifications for each item that was automatically flipped to ready
    for (const item of flippedItems) {
      try {
        // Get order details for notifications
        const order = await storage.getOrderById(item.orderId);
        
        if (order) {
          // Get bay details
          const bay = await storage.getBayById(order.bayId);
          
          // Calculate elapsed time
          const firedAt = item.firedAt || new Date();
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - firedAt.getTime()) / 1000);
          
          // Create notification message
          const readyMessage = {
            type: 'item_ready',
            data: {
              orderId: item.orderId,
              orderItem: toOrderItemDTO(item),
              station: item.station || '',
              readyAt: item.readyAt ? item.readyAt.toISOString() : now.toISOString(),
              elapsedSeconds,
              bayId: order.bayId,
              bayNumber: bay?.number || order.bayId,
              status: 'READY'
            }
          };
          
          // Send notifications
          broadcastUpdate('item_ready', readyMessage.data);
          sendBayUpdate(order.bayId, 'item_ready', readyMessage.data);
          
          console.log(`Auto-flipped item ${item.id} to READY status`);
        }
      } catch (itemError) {
        console.error(`Error processing ready notification for item ${item.id}:`, itemError);
      }
    }
  } catch (error) {
    console.error('Error in timer check:', error);
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