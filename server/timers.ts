/**
 * Timer-related functionality for the kitchen management system
 * 
 * This module handles background tasks like automatically checking
 * for items that should be marked as ready based on their timer.
 * Also handles automatic transitions through order lifecycle states.
 */

import { storage } from './storage';
import { broadcastUpdate, sendBayUpdate } from './ws';
import { toOrderItemDTO, toOrderDTO } from './dto';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { OrderStatus } from '@shared/schema';

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
 * Check for orders in DINING status and transition to PAID after a delay
 * This simulates customers finishing their meal and paying
 */
export async function checkDiningOrders() {
  try {
    console.log('Checking for orders in DINING status...');
    
    // Get all orders in DINING status
    const orders = await storage.getOrdersByStatus(OrderStatus.DINING);
    
    // Filter for orders that have been in DINING status for more than 2 minutes
    // (in production this would be much longer, but shortened for demo)
    const now = new Date();
    const ordersReadyForPayment = orders.filter(order => {
      // If createdAt is actually a string, parse it to a Date first
      const createdAt = typeof order.createdAt === 'string' 
        ? new Date(order.createdAt) 
        : order.createdAt;
      
      // Calculate minutes in dining status (normally would track a status change timestamp)
      const minutesElapsed = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
      
      // In a real system, we'd track when the status changed to DINING
      // For demo purposes, we're using a short timeout
      return minutesElapsed > 2;
    });
    
    console.log(`Found ${ordersReadyForPayment.length} orders to transition to PAID status`);
    
    // Transition each order to PAID status
    for (const order of ordersReadyForPayment) {
      try {
        await storage.updateOrderStatus(order.id, OrderStatus.PAID);
        console.log(`Transitioned order ${order.id} from DINING to PAID status`);
        
        // Broadcast the update
        const updatedOrders = await storage.getActiveOrders();
        broadcastUpdate('ordersUpdate', updatedOrders);
        
        // Get full order for detailed update
        const fullOrder = await storage.getOrderWithItems(order.id);
        
        if (fullOrder) {
          // Create order update message
          const orderUpdatedMessage = {
            type: 'order_updated',
            data: {
              order: toOrderDTO(order),
              items: fullOrder.items.map(item => toOrderItemDTO(item)),
              status: OrderStatus.PAID,
              timeElapsed: Math.round((Date.now() - new Date(fullOrder.createdAt).getTime()) / 60000),
              estimatedCompletionTime: fullOrder.estimatedCompletionTime 
                ? new Date(fullOrder.estimatedCompletionTime).toISOString() 
                : null,
              completionTime: new Date().toISOString(),
              isDelayed: false
            }
          };
          
          // Send update to the specific bay
          sendBayUpdate(order.bayId, 'order_updated', orderUpdatedMessage.data);
        }
      } catch (orderError) {
        console.error(`Error transitioning order ${order.id} to PAID status:`, orderError);
      }
    }
  } catch (error) {
    console.error('Error checking dining orders:', error);
  }
}

/**
 * Start the background timer process
 */
export function startTimers() {
  console.log('Starting kitchen timer background tasks...');
  
  // Check cooking items every 5 seconds
  setInterval(checkCookingItems, 5000);
  
  // Check dining orders every 30 seconds
  setInterval(checkDiningOrders, 30000);
}