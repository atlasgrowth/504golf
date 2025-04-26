import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import ws from "ws";

// Configure Neon to use the WebSocket implementation
neonConfig.webSocketConstructor = ws;

// This migration adds the kitchen timer related fields to our database tables

export async function runMigration() {
  // Create a database connection
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    console.log("Running kitchen timer fields migration...");

    // Add new columns to orders table
    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS expected_ready_at TIMESTAMP WITH TIME ZONE;
    `);

    // Add new columns to order_items table
    await db.execute(sql`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS cook_seconds INTEGER DEFAULT 300,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'QUEUED',
      ADD COLUMN IF NOT EXISTS fired_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS ready_by TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS drop_at TIMESTAMP WITH TIME ZONE;
    `);

    // Add cook_time_sec column to menu_items table
    await db.execute(sql`
      ALTER TABLE menu_items
      ADD COLUMN IF NOT EXISTS cook_time_sec INTEGER DEFAULT 300;
    `);

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}