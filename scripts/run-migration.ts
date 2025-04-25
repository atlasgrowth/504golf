import path from 'path';
import fs from 'fs';
import { migrate as addOrderItemStatusFields } from '../server/migrations/add-order-item-status-fields';

async function runMigrations() {
  console.log('Starting migrations...');
  
  try {
    // Run the order item status fields migration
    console.log('Running add-order-item-status-fields migration...');
    await addOrderItemStatusFields();
    
    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });