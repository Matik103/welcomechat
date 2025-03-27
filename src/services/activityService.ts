
/**
 * Simplified activity service that does nothing
 */
export async function createClientActivity(): Promise<boolean> {
  return true;
}

/**
 * Alias for createClientActivity for backward compatibility
 */
export const logClientActivity = createClientActivity;

/**
 * Fetches client activities for a given client
 */
export async function getClientActivities() {
  return [];
}

/**
 * Fetches recent activities across all clients
 */
export async function getRecentActivities() {
  return [];
}

/**
 * Counts activities by type for a specific client
 */
export async function countActivitiesByType() {
  return [];
}
