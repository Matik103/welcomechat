
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/activity';

/**
 * Creates a client activity log entry
 * This is a no-op implementation as activity logging is currently disabled
 */
export const createClientActivity = async (
  clientId?: string,
  type?: ActivityType,
  description?: string,
  metadata: any = {}
): Promise<any> => {
  // Log to console for debugging but don't attempt to write to database
  console.log(`[Activity Log] ${type}: ${description}`, {
    clientId,
    type,
    description,
    metadata
  });
  
  // Return success without actually writing to database
  return { success: true };
};

/**
 * Gets recent client activities for all clients
 */
export const getRecentActivities = async (): Promise<any[]> => {
  return [];
};

/**
 * Gets activities for a specific client
 */
export const getClientActivities = async (): Promise<any[]> => {
  return [];
};

/**
 * Counts activities by type for a specific client
 */
export const countActivitiesByType = async (): Promise<Record<string, number>> => {
  return {};
};
