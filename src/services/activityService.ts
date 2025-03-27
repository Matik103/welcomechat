

import { supabase } from '@/integrations/supabase/client';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

/**
 * Creates a client activity record - Currently just logs to console
 */
export async function createClientActivity(
  clientId: string,
  description: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    // Log to console only - completely avoiding activityType naming
    console.log(`[ACTIVITY LOG]: ${description}`, {
      clientId,
      action: 'client_activity', // Use generic action instead of activityType
      metadata,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error logging client activity:', error);
    return false;
  }
}

/**
 * Alias for createClientActivity for backward compatibility
 */
export const logClientActivity = createClientActivity;

/**
 * Fetches client activities for a given client - Currently returns empty array
 */
export async function getClientActivities(clientId: string, limit = 20, offset = 0) {
  console.log('Activity logging is disabled - client_activities table has been removed');
  return [];
}

/**
 * Fetches recent activities across all clients - Currently returns empty array
 */
export async function getRecentActivities(limit = 20, offset = 0) {
  console.log('Activity logging is disabled - client_activities table has been removed');
  return [];
}

/**
 * Counts activities by type for a specific client - Currently returns empty array
 */
export async function countActivitiesByType(clientId: string) {
  console.log('Activity logging is disabled - client_activities table has been removed');
  return [];
}
