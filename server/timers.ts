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
    
    // Temporarily disable automatic timer checks until the schema is updated
    console.log('Timer checks paused until schema migration is complete');
    return;

    /*
    // The code below will be re-enabled after migration is complete
    // and the schema has the necessary status fields
    
    // Use a simplified query approach
    try {
      const { rows } = await db.execute(sql`
        SELECT * FROM order_items 
        WHERE fired_at IS NOT NULL 
        AND completed = false
      `);
      
      console.log(`Found ${rows.length} items that are cooking`);
      
      for (const item of rows) {
        // Process cooking items logic here
      }
    } catch (queryError) {
      console.error('Error querying cooking items:', queryError);
    }
    */
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