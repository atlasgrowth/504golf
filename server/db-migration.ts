import { db } from './db';
import { bays, categories, menuItems, orders, orderItems, users } from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * This script initializes the database tables based on the schema.
 * It's used for development and testing purposes.
 */
async function main() {
  try {
    console.log('Starting database migration...');

    // Create tables
    await createTables();
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during database migration:', error);
    process.exit(1);
  }
}

async function createTables() {
  // Create tables one by one using create table if not exists statements
  console.log('Creating tables if they don\'t exist...');
  
  // Create users table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer'
    )
  `);
  console.log('Users table created or verified');

  // Create categories table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    )
  `);
  console.log('Categories table created or verified');

  // Create menu_items table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS menu_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      station TEXT NOT NULL,
      prep_seconds INTEGER NOT NULL,
      description TEXT,
      image_url TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);
  console.log('Menu items table created or verified');

  // Create bays table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bays (
      id SMALLINT PRIMARY KEY,
      number SMALLINT NOT NULL,
      floor SMALLINT NOT NULL,
      status TEXT NOT NULL DEFAULT 'empty'
    )
  `);
  console.log('Bays table created or verified');

  // Create orders table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number TEXT,
      bay_id SMALLINT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      estimated_completion_time TIMESTAMP,
      completed_at TIMESTAMP,
      special_instructions TEXT,
      order_type TEXT NOT NULL DEFAULT 'customer'
    )
  `);
  console.log('Orders table created or verified');

  // Create order_items table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL,
      menu_item_id UUID NOT NULL,
      qty INTEGER NOT NULL,
      fired_at TIMESTAMP,
      ready_by TIMESTAMP,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT
    )
  `);
  console.log('Order items table created or verified');

  // Add foreign key constraints
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey'
      ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_menu_item_id_fkey'
      ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_menu_item_id_fkey 
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_bay_id_fkey'
      ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_bay_id_fkey 
        FOREIGN KEY (bay_id) REFERENCES bays(id);
      END IF;
    END
    $$;
  `);
  console.log('Foreign key constraints added or verified');
}

// Run the migration when this file is executed directly
import { fileURLToPath } from 'url';

// Check if this module is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main()
    .then(() => {
      console.log('Migration completed. Exiting...');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export { main as runMigration };