
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
    
    // Query recent activities using RPC function to get properly typed data
    const { data, error } = await supabase.rpc('get_client_activities', {
      client_id_param: clientId,
      limit_param: limit
    });
    
    if (error) throw error;
    
    // Convert the result to the expected format
    const activities: ActivityWithClientInfo[] = (data || []).map((activity: any) => ({
      id: activity.id.toString(),
      activity_type: activity.activity_type as ActivityType,
      description: activity.activity_description || '',
      created_at: activity.created_at,
      client_id: activity.client_id,
      client_name: activity.client_name || '',
      metadata: activity.activity_metadata || {}
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
    
    // Query activities using RPC function to get properly typed data
    const { data, error } = await supabase.rpc('get_all_activities', {
      limit_param: limit
    });
    
    if (error) throw error;
    
    // Convert the result to the expected format
    const activities: ActivityWithClientInfo[] = (data || []).map((activity: any) => {
      return {
        id: activity.id.toString(),
        activity_type: activity.activity_type as ActivityType,
        description: activity.activity_description || '',
        created_at: activity.created_at,
        client_id: activity.client_id,
        client_name: activity.client_name || '',
        metadata: activity.activity_metadata || {}
      };
    });
    
    return activities;
  } catch (error) {
    console.error("Error getting all activities:", error);
    return [];
  }
};
