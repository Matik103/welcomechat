
import { ActivityType } from '@/types/activity';

/**
 * Creates a client activity log entry
 * This is a no-op implementation as activity logging is currently disabled
 */
export async function createClientActivity(
  clientId?: string,
  type?: ActivityType,
  description?: string,
  metadata: any = {}
): Promise<boolean> {
  // Log to console for debugging but don't attempt database operations
  console.log(`[Activity Log] ${type}: ${description}`, {
    clientId,
    type,
    description,
    metadata
  });
  
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
