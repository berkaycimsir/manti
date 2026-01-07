/**
 * Connection pool timing constants
 */

/**
 * Time in milliseconds before a connection is considered idle
 * Default: 30 minutes
 */
export const CONNECTION_IDLE_TIMEOUT = 30 * 60 * 1000;

/**
 * Interval in milliseconds to check for idle connections
 * Default: 5 minutes
 */
export const CONNECTION_CLEANUP_INTERVAL = 5 * 60 * 1000;
