// Import Square SDK
import { SquareClient, SquareEnvironment } from "square";

if(!process.env.SQUARE_SANDBOX_TOKEN || !process.env.SQUARE_SANDBOX_LOCATION){
  throw new Error("Square env vars missing");
}

// Initialize Square client
export const sq = new SquareClient({
  environment: process.env.SQUARE_ENV === "production" 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ENV === "production"
    ? process.env.SQUARE_PROD_TOKEN
    : process.env.SQUARE_SANDBOX_TOKEN,
});

export const catalogApi = sq.catalog;
export const ordersApi = sq.orders;
export const paymentsApi = sq.payments;