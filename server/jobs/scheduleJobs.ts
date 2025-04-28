/**
 * Job Scheduler
 * 
 * This module schedules all background jobs for the application
 * using node-cron.
 */
import * as cron from 'node-cron';
import { syncCatalog } from './syncSquareCatalog';

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduledJobs() {
  // Schedule the Square catalog sync to run every day at 3:00 AM
  // This ensures our menu stays in sync with Square
  const catalogSyncJob = cron.schedule('0 3 * * *', () => {
    console.log('Running scheduled Square catalog sync job');
    syncCatalog()
      .then(() => console.log('Scheduled catalog sync completed successfully'))
      .catch(error => console.error('Error in scheduled catalog sync:', error));
  }, {
    scheduled: true,
    timezone: "America/Chicago" // America/Chicago timezone
  });

  // Development sync job - runs every 15 minutes for testing
  const devSyncJob = cron.schedule('*/15 * * * *', () => {
    console.log('Running development Square catalog sync job');
    syncCatalog()
      .then(() => console.log('Development catalog sync completed successfully'))
      .catch(error => console.error('Error in development catalog sync:', error));
  });

  // Also run the catalog sync immediately when the server starts
  console.log('Running initial Square catalog sync');
  syncCatalog()
    .then(() => console.log('Initial catalog sync completed successfully'))
    .catch(error => console.error('Error in initial catalog sync:', error));

  // Log all scheduled jobs
  console.log('Scheduled jobs initialized:');
  console.log('- Square Catalog Sync: daily at 3:00 AM ET');

  // Return the scheduled jobs so they can be managed if needed
  return {
    catalogSyncJob,
    devSyncJob
  };
}