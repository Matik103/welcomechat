
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
    
    // Use direct Supabase insert instead of RPC for more reliable operation
    const { data, error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: validActivityType,
        description: description,
        metadata: enhancedMetadata as Json
      });
    
    if (error) {
      console.error('Error creating client activity:', error);
      return false;
    }
    
    return true;
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
    // First fetch the activities
    const { data, error } = await supabase
      .from('client_activities')
      .select('*, clients:client_id(client_name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Transform the data to include client_name directly on the activity
    const transformedData = data.map(activity => ({
      ...activity,
      // Extract client_name from the nested clients object
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
    // Use direct SQL query instead of RPC function since the RPC doesn't exist
    const { data, error } = await supabase
      .from('client_activities')
      .select('activity_type, count(*)')
      .eq('client_id', clientId)
      .group('activity_type');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error counting activities by type:', error);
    return [];
  }
}
