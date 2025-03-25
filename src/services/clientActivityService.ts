
import { supabase } from "@/integrations/supabase/client";
import { Activity, ActivityType } from "@/types/activity";

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

    const { error } = await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: activityType,
      activity_data: activityData || {},
    });

    if (error) {
      console.error(`Error logging activity (${activityType}):`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Exception logging activity (${activityType}):`, err);
    return false;
  }
}

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
