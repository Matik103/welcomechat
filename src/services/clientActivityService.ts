
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/client-form';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

/**
 * Creates a client activity record
 */
export async function createClientActivity(
  clientId: string,
  activity_type: ActivityType,
  description: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    // Map legacy activity types to valid enum values if needed
    // This ensures backward compatibility while using the valid enum values
    const activityTypeMapping: Record<string, ActivityType> = {
      'agent_created': 'ai_agent_created',
      'agent_updated': 'ai_agent_updated',
    };

    // Use the mapped activity type or the original one if no mapping exists
    const validActivityType = activityTypeMapping[activity_type as string] || activity_type;
    
    // Store the original type in metadata for reference
    const enhancedMetadata = {
      ...metadata,
      original_activity_type: activity_type !== validActivityType ? activity_type : undefined
    };
    
    // Use RPC function for better error handling and consistency
    const result = await callRpcFunctionSafe('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: validActivityType,
      description_param: description,
      metadata_param: enhancedMetadata
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
      .select('*, clients(client_name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Transform the data to include client_name directly on the activity
    const transformedData = data.map(activity => ({
      ...activity,
      client_name: activity.clients?.client_name
    }));
    
    return transformedData || [];
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
    const { data, error } = await supabase
      .rpc('count_activities_by_type', {
        client_id_param: clientId
      });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error counting activities by type:', error);
    return [];
  }
}
