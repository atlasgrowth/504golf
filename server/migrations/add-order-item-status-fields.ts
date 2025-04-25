import { db } from '../db';
import { orderItems, menuItems } from '../../packages/shared/src/schema';
import { sql } from 'drizzle-orm';

/**
 * Migration script to add new status tracking fields to order_items table
 * and backfill existing data
 */
async function migrate() {
  console.log('Starting migration for order_items table...');

  try {
    // Step 1: Add new columns if they don't exist
    console.log('Adding status column if it doesn\'t exist...');
    await db.execute(sql`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'NEW'
    `);

    console.log('Adding cook_seconds column if it doesn\'t exist...');
    await db.execute(sql`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS cook_seconds INTEGER NOT NULL DEFAULT 300
    `);

    console.log('Adding ready_at column if it doesn\'t exist...');
    await db.execute(sql`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP 
    `);

    console.log('Adding delivered_at column if it doesn\'t exist...');
    await db.execute(sql`
      ALTER TABLE order_items 
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP
    `);

    // Step 2: Make sure station is not null
    console.log('Ensuring station column is not null...');
    await db.execute(sql`
      UPDATE order_items 
      SET station = (
        SELECT station FROM menu_items 
        WHERE menu_items.id = order_items.menu_item_id
      )
      WHERE station IS NULL
    `);

    // Step 3: Backfill data for existing rows
    console.log('Backfilling data for existing items...');
    
    // Update all existing items with completed=true to have status=DELIVERED
    await db.execute(sql`
      UPDATE order_items
      SET status = 'DELIVERED'
      WHERE completed = true
    `);

    // Update all items with firedAt but not completed to COOKING
    await db.execute(sql`
      UPDATE order_items
      SET status = 'COOKING'
      WHERE fired_at IS NOT NULL AND completed = false
    `);

    // Calculate readyAt for all items with firedAt
    await db.execute(sql`
      UPDATE order_items
      SET ready_at = fired_at + (cook_seconds * INTERVAL '1 second')
      WHERE fired_at IS NOT NULL AND ready_at IS NULL
    `);

    // Copy prep_seconds from menu_items to cook_seconds for items that have default
    const orderItemsWithDefaultCookSeconds = await db.execute(sql`
      SELECT oi.id, mi.prep_seconds 
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.cook_seconds = 300
    `);

    for (const row of orderItemsWithDefaultCookSeconds.rows) {
      await db.execute(sql`
        UPDATE order_items
        SET cook_seconds = ${row.prep_seconds}
        WHERE id = ${row.id}
      `);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrate };