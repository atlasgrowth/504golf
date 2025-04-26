import { runMigration } from './migrations/001_add_kitchen_timer_fields';

// Execute the migration
async function migrate() {
  try {
    await runMigration();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();