/**
 * Migration to add Square integration fields to the database
 */
import { db, pool } from '../db';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';

/**
 * Add Square-related columns to menuItems, orders, and orderItems tables
 */
export async function up() {
  console.log('Running migration: Add Square integration fields');

  try {
    // Add square_id to menuItems table
    await db.execute(sql`
      ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS square_id TEXT UNIQUE
    `);

    // Add square_order_id and payment_status to orders table
    await db.execute(sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS square_order_id TEXT,
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'OPEN'
    `);

    // Add square_line_item_id to orderItems table
    await db.execute(sql`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS square_line_item_id TEXT
    `);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Remove the added columns from the tables
 */
export async function down() {
  console.log('Running down migration: Remove Square integration fields');
  
  try {
    // Remove square_id from menuItems table
    await db.execute(sql`
      ALTER TABLE menu_items
      DROP COLUMN IF EXISTS square_id
    `);

    // Remove square_order_id and payment_status from orders table
    await db.execute(sql`
      ALTER TABLE orders
      DROP COLUMN IF EXISTS square_order_id,
      DROP COLUMN IF EXISTS payment_status
    `);

    // Remove square_line_item_id from orderItems table
    await db.execute(sql`
      ALTER TABLE order_items
      DROP COLUMN IF EXISTS square_line_item_id
    `);

    console.log('Down migration completed successfully');
  } catch (error) {
    console.error('Down migration failed:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
// For ESM modules, we can just call the function
up()
  .then(() => {
    console.log('Migration completed successfully');
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });