// Kitchen timer utilities

export const PREP_BUFFER_SEC = parseInt(process.env.PREP_BUFFER_SEC ?? '60');
export const EXPO_BUFFER_SEC = parseInt(process.env.EXPO_BUFFER_SEC ?? '60');
export const DELAY_GRACE_SEC = parseInt(process.env.DELAY_GRACE_SEC ?? '120');

/**
 * Computes when an order should be ready based on the longest cooking item plus buffers
 */
export function computeExpectedReady(items: { cook_time_sec: number }[]): Date {
  if (!items || !items.length) {
    return new Date(Date.now() + 1000 * (300 + PREP_BUFFER_SEC + EXPO_BUFFER_SEC));
  }
  
  const maxCook = Math.max(...items.map(i => i.cook_time_sec || 300));
  return new Date(Date.now() + 1000 * (maxCook + PREP_BUFFER_SEC + EXPO_BUFFER_SEC));
}

/**
 * Computes when an item should start cooking to be ready by the expected time
 */
export function computeDropAt(itemCookSec: number, expected: Date): Date {
  return new Date(expected.getTime() - 1000 * (itemCookSec + EXPO_BUFFER_SEC));
}

/**
 * Returns true if an order is delayed based on its expected completion time
 */
export function isOrderDelayed(expectedReadyAt: Date | null): boolean {
  if (!expectedReadyAt) return false;
  
  const now = new Date();
  const delayThreshold = new Date(expectedReadyAt.getTime() + 1000 * DELAY_GRACE_SEC);
  
  return now > delayThreshold;
}

/**
 * Calculates how many seconds until an item should be dropped (started cooking)
 */
export function secondsUntilDrop(dropAt: Date | null): number {
  if (!dropAt) return 0;
  
  const now = new Date();
  const diffMs = dropAt.getTime() - now.getTime();
  
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Calculates how many seconds an order is delayed
 */
export function secondsDelayed(expectedReadyAt: Date | null): number {
  if (!expectedReadyAt) return 0;
  
  const now = new Date();
  const delayThreshold = new Date(expectedReadyAt.getTime() + 1000 * DELAY_GRACE_SEC);
  
  if (now <= delayThreshold) return 0;
  
  const diffMs = now.getTime() - delayThreshold.getTime();
  return Math.floor(diffMs / 1000);
}

/**
 * Formats a time countdown in MM:SS format
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}