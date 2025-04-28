// Import Square SDK
import { SquareClient, SquareEnvironment } from "square";

// Make sure environment variables are loaded from Replit Secrets
if(!process.env.SQUARE_SANDBOX_TOKEN || !process.env.SQUARE_SANDBOX_LOCATION){
  console.warn("Square credentials not found in environment variables. If using Replit Secrets, this may still work.");
}

// Initialize Square client
export const sq = new SquareClient({
  environment: process.env.SQUARE_ENV === "production" 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ENV === "production"
    ? process.env.SQUARE_PROD_TOKEN || process.env.REPLIT_SQUARE_PROD_TOKEN
    : process.env.SQUARE_SANDBOX_TOKEN || process.env.REPLIT_SQUARE_SANDBOX_TOKEN,
});

export const catalogApi = sq.catalog;
export const ordersApi = sq.orders;
export const paymentsApi = sq.payments;