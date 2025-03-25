
import { supabase } from "@/integrations/supabase/client";
import { execSql } from "@/utils/rpcUtils";

/**
 * Logs a client activity using the RPC function
 * @param clientId Client ID 
 * @param activityType Type of activity
 * @param description Description of the activity
 * @param metadata Additional metadata
 * @returns Promise with the result
 */
export const createClientActivityLog = async (
  clientId: string,
  activityType: string, 
  description: string,
  metadata: Record<string, any> = {}
): Promise<any> => {
  try {
    // Use the RPC function to avoid type issues
    const result = await execSql(`
      SELECT * FROM log_client_activity(
        $1, $2, $3, $4::jsonb
      )
    `, [
      clientId,
      activityType,
      description,
      JSON.stringify(metadata)
    ]);

    console.log('Activity logged successfully:', { clientId, activityType, description });
    return result;
  } catch (error) {
    console.error('Error logging client activity:', error);
    throw error;
  }
};

/**
 * Gets recent activities for a client
 * @param clientId Client ID
 * @param limit Number of activities to return
 * @returns Array of activities
 */
export const getRecentClientActivities = async (clientId: string, limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select(`
        id,
        activity_type,
        description,
        created_at,
        metadata
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching client activities:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentClientActivities:', error);
    return [];
  }
};
