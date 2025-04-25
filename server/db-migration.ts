import { dbStorage } from './db-storage';

// This script initializes the database with tables and seed data
async function main() {
  console.log('Starting database migration...');
  
  try {
    await dbStorage.initializeData();
    console.log('Database migration completed successfully.');
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();