import crypto from "crypto";
import express, { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { orders } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Create a raw body parser middleware
export const webhook = express.Router();

// Middleware to parse raw body for webhook verification
const rawBodyParser = express.raw({ type: "*/*" });

webhook.post("/square/webhook", rawBodyParser, async (req: Request, res: Response) => {
  const sig = req.get("x-square-signature") || "";
  const body = req.body.toString("utf8");
  
  // Verify webhook signature
  const hash = crypto.createHmac("sha1", process.env.SQUARE_WEBHOOK_SECRET!)
                    .update(req.originalUrl + body).digest("base64");
  
  if (hash !== sig) {
    console.error("Square webhook signature verification failed");
    return res.sendStatus(401);
  }

  try {
    // Parse the event payload
    const event = JSON.parse(body);
    console.log("Received Square webhook event:", event.type);
    
    // Handle payment.created event
    if (event.type === "payment.created") {
      const orderId = event.data.object.payment.order_id;
      console.log(`Updating order payment status for Square order ID: ${orderId}`);
      
      // Update the order's payment status
      await db.update(orders)
        .set({ payment_status: "PAID" })
        .where(eq(orders.square_order_id, orderId))
        .execute();
        
      console.log("Order payment status updated to PAID");
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing Square webhook:", error);
    res.status(500).send("Error processing webhook");
  }
});