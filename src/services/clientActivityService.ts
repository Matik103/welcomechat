
import { supabase } from "@/integrations/supabase/client";
import { Activity, ActivityType } from "@/types/activity";
import { callRpcFunction } from "@/utils/rpcUtils";

/**
 * Logs an activity for a client
 * @param clientId The client ID
 * @param activityType Type of activity
 * @param activityData Additional data about the activity
 * @returns Success flag
 */
export async function logClientActivity(
  clientId: string,
  activityType: ActivityType,
  activityData?: Record<string, any>
): Promise<boolean> {
  try {
    console.log(`Logging activity: ${activityType} for client ${clientId}`);

    // Use callRpcFunction instead of direct insert to handle type conversions safely
    const result = await callRpcFunction('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: activityType,
      description_param: "",
      metadata_param: activityData || {}
    });

    if (!result) {
      console.error(`Error logging activity (${activityType}): No result returned`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Exception logging activity (${activityType}):`, err);
    return false;
  }
}

/**
 * Creates a client activity with a description (used by DeleteClientDialog)
 * @param clientId The client ID
 * @param activityType Type of activity
 * @param description Human-readable description of the activity
 * @param metadata Additional metadata about the activity
 * @returns Success flag
 */
export async function createActivityDirect(
  clientId: string,
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    console.log(`Creating activity: ${activityType} - ${description} for client ${clientId}`);
    
    // Use callRpcFunction to safely handle type conversions
    const result = await callRpcFunction('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: activityType,
      description_param: description,
      metadata_param: metadata || {}
    });

    if (!result) {
      console.error(`Error creating activity (${activityType}): No result returned`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Exception creating activity (${activityType}):`, err);
    return false;
  }
}

/**
 * Creates a new client activity record (alias for backward compatibility)
 * @deprecated Use createActivityDirect instead
 */
export const createClientActivity = createActivityDirect;

/**
 * Get recent activities for a client
 * @param clientId The client ID
 * @param limit Maximum number of activities to return (default: 20)
 * @returns List of activities
 */
export async function getClientActivities(
  clientId: string,
  limit: number = 20
): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from("client_activities")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching client activities:", error);
      throw error;
    }

    return data as Activity[];
  } catch (err) {
    console.error("Exception fetching client activities:", err);
    return [];
  }
}
