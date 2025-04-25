// Export all types from our schema
export * from "../../shared/schema";

// Export WebSocket related types
export * from "./types";

// Export utility functions and constants
export const KITCHEN_STATIONS = [
  "grill",
  "fry",
  "cold",
  "bar",
  "main"
];

/**
 * Generate a simple display number from an order ID
 * To make it easier for kitchen staff to call out order numbers
 */
export function getOrderDisplayNumber(orderId: string): number {
  // Take the last 4 characters from the UUID and convert to a number
  const idEnd = orderId.substring(orderId.length - 4);
  // Convert to hex number and modulo 1000 to get a 3-digit number
  return (parseInt(idEnd, 16) % 1000);
}

/**
 * Calculate if an order is delayed based on current time and estimated completion
 */
export function isOrderDelayed(estimatedCompletionTime: string | Date | null): boolean {
  if (!estimatedCompletionTime) return false;
  
  const estimatedTime = typeof estimatedCompletionTime === 'string' 
    ? new Date(estimatedCompletionTime)
    : estimatedCompletionTime;
    
  return new Date() > estimatedTime;
}

/**
 * Get minutes remaining until estimated completion time
 * Returns negative number if order is delayed
 */
export function getMinutesRemaining(estimatedCompletionTime: string | Date | null): number {
  if (!estimatedCompletionTime) return 0;
  
  const estimatedTime = typeof estimatedCompletionTime === 'string' 
    ? new Date(estimatedCompletionTime)
    : estimatedCompletionTime;
    
  const timeDiffMs = estimatedTime.getTime() - new Date().getTime();
  return Math.round(timeDiffMs / 60000); // Convert ms to minutes
}

/**
 * Format minutes as a human-readable string (e.g., "5 min", "-2 min")
 */
export function formatMinutes(minutes: number): string {
  const prefix = minutes < 0 ? "" : "+";
  return `${prefix}${minutes} min`;
}