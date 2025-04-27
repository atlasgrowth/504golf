// Timer utility for periodic background tasks
import { storage } from './storage';
import { OrderStatus, OrderItemStatus } from '@shared/schema';
import { toOrderDTO, toOrderItemDTO } from './dto';
import { broadcastUpdate, sendBayUpdate } from './ws';

/**
 * This module contains timer-based background tasks for the application.
 * These tasks run periodically to check for state changes and perform
 * automated actions like marking items as ready when their cook time is up.
 */

/**
 * Check for cooking items that have reached their ready time
 * and mark them as ready automatically
 */
export async function checkCookingItems() {
  try {
    console.log('Checking for items that need to be marked as ready...');
    
    // This now just identifies items that have completed their cook time
    // but does NOT automatically mark them as ready
    const readyToCookItems = await storage.autoFlipReady();
    
    console.log(`Found ${readyToCookItems.length} items that should be marked as ready`);
    
    // We no longer auto-mark items as ready, so no need to send any update notifications
    // The items will show "READY TO CHECK" on their badge but will remain in COOKING state
    // until a kitchen staff member manually checks them off
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