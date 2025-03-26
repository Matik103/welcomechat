
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/client-form';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

/**
 * Creates a client activity record
 */
export async function createClientActivity(
  clientId: string,
  activityType: ActivityType,
  description: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    // Use RPC call for better safety and consistency
    const result = await callRpcFunctionSafe('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: activityType,
      description_param: description,
      metadata_param: metadata
    });
    
    return !!result;
  } catch (error) {
    console.error('Error creating client activity:', error);
    return false;
  }
}

/**
 * Alias for createClientActivity for backward compatibility
 */
export const logClientActivity = createClientActivity;

/**
 * Fetches client activities for a given client
 */
export async function getClientActivities(clientId: string, limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client activities:', error);
    return [];
  }
}

/**
 * Fetches recent activities across all clients
 */
export async function getRecentActivities(limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('*, ai_agents(client_name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

/**
 * Counts activities by type for a specific client
 */
export async function countActivitiesByType(clientId: string) {
  try {
    const result = await callRpcFunctionSafe('log_client_activity', {
      client_id_param: clientId
    });
    
    return result || [];
  } catch (error) {
    console.error('Error counting activities by type:', error);
    return [];
  }
}
