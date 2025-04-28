/**
 * Square Payment Processing Integration
 * 
 * This module handles payment processing through the Square API
 */
import { paymentsApi, ordersApi } from "./square";
import { dbStorage } from "../db-storage";
import { OrderStatus } from "../../shared/schema";

/**
 * Process payment for a SwingEats order using Square
 * @param orderId The SwingEats order ID
 * @param sourceId The Square payment source ID (card nonce, etc)
 * @param amount Amount in cents
 */
export async function processPayment(orderId: string, sourceId: string, amount: number) {
  try {
    console.log(`Processing payment for order ${orderId} with amount ${amount} cents`);
    
    // Get our order from the database
    const order = await dbStorage.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    // Get the location ID from environment variables
    const locationId = process.env.SQUARE_ENV === "production"
      ? process.env.SQUARE_PROD_LOCATION
      : process.env.SQUARE_SANDBOX_LOCATION;
      
    if (!locationId) {
      throw new Error("Square location ID not configured");
    }
    
    // If the order doesn't have a Square order ID yet, create one
    let squareOrderId = order.square_order_id || null;
    
    if (!squareOrderId) {
      // Create a Square order first
      const createOrderResponse = await ordersApi.create({
        order: {
          locationId,
          referenceId: orderId,
          lineItems: [
            {
              name: `SwingEats Order #${orderId}`,
              quantity: "1",
              basePriceMoney: {
                amount: amount,
                currency: "USD",
              },
            },
          ],
        },
        idempotencyKey: `swing-eats-order-${orderId}-${Date.now()}`,
      });
      
      if (createOrderResponse.order && createOrderResponse.order.id) {
        squareOrderId = createOrderResponse.order.id;
        
        // Update our order with the Square order ID
        await dbStorage.updateOrderSquareId(orderId, squareOrderId);
      } else {
        throw new Error("Failed to create Square order");
      }
    }
    
    // Process the payment with Square
    const paymentResponse = await paymentsApi.create({
      sourceId,
      idempotencyKey: `swing-eats-payment-${orderId}-${Date.now()}`,
      amountMoney: {
        amount: BigInt(amount),
        currency: "USD",
      },
      orderId: squareOrderId,
      locationId,
      // Include customer data if needed
    });
    
    // Check if payment was successful
    if (paymentResponse.payment && paymentResponse.payment.status === "COMPLETED") {
      // Update our order status to PAID
      await dbStorage.updateOrderStatus(orderId, OrderStatus.PAID);
      // Store payment ID for reference
      await dbStorage.updateOrderPaymentStatus(
        orderId, 
        "PAID", 
        paymentResponse.payment.id
      );
      
      return {
        success: true,
        paymentId: paymentResponse.payment.id,
        status: paymentResponse.payment.status,
      };
    } else {
      // Payment wasn't completed
      const paymentStatus = paymentResponse.payment?.status || "FAILED";
      const paymentId = paymentResponse.payment?.id;
      
      await dbStorage.updateOrderPaymentStatus(
        orderId,
        paymentStatus,
        paymentId
      );
      
      return {
        success: false,
        status: paymentStatus,
        message: "Payment not completed",
      };
    }
    
  } catch (error: any) {
    console.error("Square payment processing error:", error);
    
    // Update order payment status to failed
    try {
      await dbStorage.updateOrderPaymentStatus(orderId, "FAILED");
    } catch (updateError) {
      console.error("Failed to update order payment status:", updateError);
    }
    
    return {
      success: false,
      status: "FAILED",
      message: error.message || "Payment processing failed",
      error: error,
    };
  }
}

/**
 * Check payment status for an order
 * @param orderId The SwingEats order ID
 */
export async function checkPaymentStatus(orderId: string) {
  try {
    // Get order details from database
    const order = await dbStorage.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    // If order doesn't have a payment status, it hasn't been processed
    if (!order.payment_status) {
      return {
        status: "NOT_PROCESSED",
        message: "Payment has not been processed yet",
      };
    }
    
    // If we don't have a payment_id field in our schema yet
    if (!order.payment_status) {
      return {
        status: order.payment_status || "UNKNOWN",
        message: `Payment status: ${order.payment_status || "UNKNOWN"}`,
      };
    }
    
    // If we have a payment_id, get payment details from Square
    const paymentId = (order as any).payment_id;
    if (paymentId) {
      const paymentResponse = await paymentsApi.get(paymentId);
      
      return {
        success: paymentResponse.payment?.status === "COMPLETED",
        status: paymentResponse.payment?.status || "UNKNOWN",
        paymentId: paymentId,
        updatedAt: paymentResponse.payment?.updatedAt,
      };
    }
    
    // Default response if we don't have enough info
    return {
      status: order.payment_status || "UNKNOWN",
      message: `Payment status from local database: ${order.payment_status}`,
    };
    
  } catch (error: any) {
    console.error("Error checking payment status:", error);
    return {
      success: false,
      status: "ERROR",
      message: error.message || "Failed to check payment status",
    };
  }
}