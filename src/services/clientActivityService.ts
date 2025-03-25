
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ExtendedActivityType } from "@/types/activity";
import { callRpcFunction } from "@/utils/rpcUtils";

/**
 * Log an activity for a client
 * @param clientId The client ID
 * @param activityType The activity type
 * @param description A description of the activity
 * @param metadata Optional metadata
 * @returns The created activity or null if creation failed
 */
export const createClientActivity = async (
  clientId: string,
  activityType: ActivityType | ExtendedActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<any> => {
  try {
    if (!clientId) {
      console.warn('No client ID provided for activity logging');
      return null;
    }

    console.log(`Logging activity ${activityType} for client ${clientId}: ${description}`);
    
    // Use RPC function to log activity
    const result = await callRpcFunction('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: activityType,
      description_param: description,
      metadata_param: metadata || {}
    });
    
    return result;
  } catch (error) {
    console.error('Error logging client activity:', error);
    return null;
  }
};

/**
 * Direct insertion method for special cases (e.g. server-side or system operations)
 * This is a compatibility method for existing code that expects this function
 */
export const createActivityDirect = async (
  clientId: string,
  activityType: ActivityType | ExtendedActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<any> => {
  try {
    // Use callRpcFunction to execute the SQL safely
    return await createClientActivity(clientId, activityType, description, metadata);
  } catch (error) {
    console.error('Error in createActivityDirect:', error);
    return null;
  }
};

/**
 * Get recent activities for a client
 * @param clientId The client ID
 * @param limit Max number of activities to return
 * @returns Recent activities
 */
export const getClientActivities = async (clientId: string, limit = 10): Promise<any[]> => {
  try {
    // Query client activities
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client activities:', error);
    return [];
  }
};

// Legacy export for backwards compatibility
export const ClientActivityService = {
  createClientActivity,
  createActivityDirect,
  getClientActivities
};
