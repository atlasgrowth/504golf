/**
 * Square SDK wrapper
 * Initializes the Square client based on environment settings
 */
import * as Square from "square";

// Initialize Square client based on environment
// The token is provided via the environment variable
export const sq = new Square.SquareClient({
  // Use token for authentication
  token: process.env.SQUARE_ENV === "production"
    ? process.env.SQUARE_PROD_TOKEN
    : process.env.SQUARE_SANDBOX_TOKEN,
  // Set environment based on configuration
  environment: process.env.SQUARE_ENV === "production" 
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com"
});

// Export specific API clients for easier access
export const catalog = sq.catalog;
export const orders = sq.orders;
export const payments = sq.payments;