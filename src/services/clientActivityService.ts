
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ActivityWithClientInfo } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

/**
 * Create a new activity record for a client
 * @param clientId The client ID
 * @param activityType The type of activity
 * @param description The activity description
 * @param metadata Additional metadata for the activity
 * @returns The created activity record
 */
export const createActivityDirect = async (
  clientId: string,
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<any> => {
  try {
    console.log(`Creating activity for client ${clientId}: ${activityType} - ${description}`);
    
    // Use the RPC function instead of direct table insert to handle type validation
    const { data, error } = await supabase.rpc('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: activityType,
      description_param: description,
      metadata_param: metadata || {}
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating activity:", error);
    // Don't throw - activities should be non-blocking
    return null;
  }
};

// Alias for backward compatibility
export const createClientActivity = createActivityDirect;

/**
 * Get recent activities for a client
 * @param clientId The client ID
 * @param limit The maximum number of activities to retrieve
 * @returns Recent activities
 */
export const getRecentActivities = async (
  clientId: string, 
  limit: number = 10
): Promise<ActivityWithClientInfo[]> => {
  try {
    console.log(`Getting recent activities for client ${clientId}, limit: ${limit}`);
    
    // Query recent activities
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Convert to the expected format
    const activities = (data || []).map(activity => ({
      id: activity.id.toString(),
      activity_type: activity.activity_type as ActivityType,
      description: activity.description || '',
      created_at: activity.created_at,
      client_id: activity.client_id,
      metadata: activity.metadata || {}
    }));
    
    return activities;
  } catch (error) {
    console.error("Error getting recent activities:", error);
    return [];
  }
};

/**
 * Get all activities
 * @param limit The maximum number of activities to retrieve
 * @returns All activities with client info
 */
export const getAllActivities = async (
  limit: number = 50
): Promise<ActivityWithClientInfo[]> => {
  try {
    console.log(`Getting all activities, limit: ${limit}`);
    
    // Query activities with client info
    const { data, error } = await supabase
      .from('client_activities')
      .select(`
        *,
        ai_agents!client_activities_client_id_fkey (
          client_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Convert to the expected format with proper null checks
    const activities = (data || []).map(activity => {
      // Extract client name safely
      const clientName = activity.ai_agents && 
                       typeof activity.ai_agents === 'object' && 
                       'client_name' in activity.ai_agents ? 
                       activity.ai_agents.client_name || '' : 
                       '';
      
      return {
        id: activity.id.toString(),
        activity_type: activity.activity_type as ActivityType,
        description: activity.description || '',
        created_at: activity.created_at,
        client_id: activity.client_id,
        client_name: clientName,
        metadata: activity.metadata || {}
      };
    });
    
    return activities;
  } catch (error) {
    console.error("Error getting all activities:", error);
    return [];
  }
};
