import { pgTable, text, integer, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "../../shared/schema";

// This script adds cook_seconds column to menu_items table
async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const db = drizzle(pool);
    
    console.log("Adding cook_seconds column to menu_items table...");

    await db.execute(sql`
      ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cook_seconds INTEGER DEFAULT 300
    `);
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);