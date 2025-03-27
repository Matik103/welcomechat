
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
      'url_added': 'website_url_added',
      'url_removed': 'website_url_deleted',
      'url_processed': 'website_url_processed',
      'url_processing_failed': 'document_processing_failed'
    };

    // Use the mapped activity type or the original one if no mapping exists
    const validActivityType = activityTypeMapping[activity_type as string] || activity_type;
    
    // Store the original type in metadata for reference
    const enhancedMetadata = {
      ...metadata,
      original_activity_type: activity_type !== validActivityType ? activity_type : undefined
    };
    
    // Use direct Supabase insert instead of RPC for more reliable operation
    // Cast the activity_type to string to avoid type issues
    const { data, error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: validActivityType as string,
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
    // First fetch the activities without the join to clients
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Then fetch client names in a separate query if needed
    // This avoids the join issue
    if (data && data.length > 0) {
      const clientIds = [...new Set(data.filter(a => a.client_id).map(a => a.client_id))];
      
      if (clientIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, client_name')
          .in('id', clientIds);
          
        // Create a lookup map for client names
        const clientMap = new Map();
        if (clientsData) {
          clientsData.forEach(client => {
            clientMap.set(client.id, client.client_name);
          });
        }
        
        // Add client names to the activities
        return data.map(activity => ({
          ...activity,
          client_name: activity.client_id ? clientMap.get(activity.client_id) : undefined
        }));
      }
    }
    
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
    // Use a direct SQL query through Supabase instead of using the RPC
    const { data, error } = await supabase
      .from('client_activities')
      .select('activity_type, count(*)')
      .eq('client_id', clientId)
      .groupBy('activity_type');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error counting activities by type:', error);
    return [];
  }
}
