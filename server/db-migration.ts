import { db } from './db';
import { bays, categories, menuItems, orders, orderItems, users } from '@shared/schema';

/**
 * This script initializes the database tables based on the schema.
 * It's used for development and testing purposes.
 */
async function main() {
  console.log('Creating database tables...');
  try {
    await createTables();
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

async function createTables() {
  // Using drizzle-kit directly for migrations
  console.log('Creating users table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer'
    )
  `);

  console.log('Creating categories table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    )
  `);

  console.log('Creating bays table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bays (
      id SMALLINT PRIMARY KEY,
      number SMALLINT NOT NULL,
      floor SMALLINT NOT NULL,
      status TEXT NOT NULL DEFAULT 'empty'
    )
  `);

  console.log('Creating menu_items table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      station TEXT NOT NULL,
      prep_seconds INTEGER NOT NULL,
      description TEXT,
      image_url TEXT,
      active BOOLEAN NOT NULL DEFAULT true
    )
  `);

  console.log('Creating orders table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number TEXT,
      bay_id SMALLINT NOT NULL REFERENCES bays(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      special_instructions TEXT,
      order_type TEXT NOT NULL DEFAULT 'customer'
    )
  `);

  console.log('Creating order_items table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id),
      menu_item_id UUID NOT NULL REFERENCES menu_items(id),
      quantity INTEGER NOT NULL,
      fired_at TIMESTAMP,
      ready_by TIMESTAMP,
      completed BOOLEAN NOT NULL DEFAULT false,
      notes TEXT
    )
  `);
}

// Run the script if executed directly
if (require.main === module) {
  main().then(() => process.exit(0));
}