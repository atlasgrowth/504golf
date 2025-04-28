/**
 * Square Webhook Handler
 * 
 * This module handles webhook notifications from Square for payment status updates.
 * It verifies the webhook signature to ensure the request is legitimate and processes
 * the events to update order payment statuses in our database.
 */
import { Request, Response } from 'express';
import crypto from 'crypto';
import { dbStorage } from '../db-storage';
import { OrderStatus } from '../../shared/schema';

/**
 * Verify Square webhook signature
 * @param body The raw request body as a string
 * @param signature The signature from the Square-Signature header
 * @returns boolean indicating if the signature is valid
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    if (!process.env.SQUARE_WEBHOOK_SECRET) {
      console.error('SQUARE_WEBHOOK_SECRET environment variable is not set');
      return false;
    }

    const hmac = crypto.createHmac('sha256', process.env.SQUARE_WEBHOOK_SECRET);
    const calculatedSignature = hmac.update(body).digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Process Square webhook events
 */
export async function handleSquareWebhook(req: Request, res: Response) {
  try {
    // Get the signature from headers
    const squareSignature = req.header('Square-Signature');
    
    if (!squareSignature) {
      console.error('Missing Square-Signature header');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Get the raw body as a string
    const rawBody = JSON.stringify(req.body);
    
    // Verify the webhook signature
    const isValidSignature = verifyWebhookSignature(rawBody, squareSignature);
    
    if (!isValidSignature) {
      console.error('Invalid Square webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process the webhook payload
    const eventType = req.body.type;
    const eventData = req.body.data;
    
    console.log(`Received Square webhook event: ${eventType}`);
    
    // Handle different webhook event types
    switch (eventType) {
      case 'payment.updated':
        await handlePaymentUpdated(eventData);
        break;
        
      case 'order.updated':
        await handleOrderUpdated(eventData);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
    
    // Respond with success to acknowledge receipt of the webhook
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error processing Square webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle payment.updated webhook event
 */
async function handlePaymentUpdated(eventData: any) {
  try {
    const payment = eventData.object.payment;
    const orderId = payment.order_id;
    const status = payment.status;
    
    console.log(`Payment updated for order ${orderId} with status ${status}`);
    
    // Find our order that corresponds to this Square order
    // We need to query by square_order_id since this is coming from Square
    const order = await dbStorage.getOrderBySquareId(orderId);
    
    if (!order) {
      console.log(`No matching order found for Square order ID: ${orderId}`);
      return;
    }
    
    // Update the payment status in our database
    await dbStorage.updateOrderPaymentStatus(
      order.id,
      status,
      payment.id
    );
    
    // If payment is completed, also update the order status to PAID
    if (status === 'COMPLETED') {
      await dbStorage.updateOrderStatus(order.id, OrderStatus.PAID);
      console.log(`Order ${order.id} marked as PAID`);
    }
    
  } catch (error) {
    console.error('Error handling payment update webhook:', error);
  }
}

/**
 * Handle order.updated webhook event
 */
async function handleOrderUpdated(eventData: any) {
  try {
    const squareOrder = eventData.object.order;
    const squareOrderId = squareOrder.id;
    const state = squareOrder.state;
    
    console.log(`Order updated with ID ${squareOrderId} and state ${state}`);
    
    // Find our order that corresponds to this Square order
    const order = await dbStorage.getOrderBySquareId(squareOrderId);
    
    if (!order) {
      console.log(`No matching order found for Square order ID: ${squareOrderId}`);
      return;
    }
    
    // Map Square order states to our order statuses if needed
    // This depends on how we want to sync Square order states with our own statuses
    switch (state) {
      case 'COMPLETED':
        await dbStorage.updateOrderStatus(order.id, "COMPLETED");
        break;
      
      case 'CANCELED':
        await dbStorage.updateOrderStatus(order.id, "CANCELLED");
        break;
        
      // Add more state mappings as needed
    }
    
  } catch (error) {
    console.error('Error handling order update webhook:', error);
  }
}