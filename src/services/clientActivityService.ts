
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a new client activity record
 */
export const createClientActivity = async (
  clientId: string,
  clientName: string,
  activityType: string,
  description: string,
  activityData: Record<string, any> = {}
): Promise<boolean> => {
  try {
    if (!clientId || !activityType) {
      console.error("Missing required parameters for activity logging");
      return false;
    }
    
    const { error } = await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: activityType,
      description: description,
      activity_data: activityData
    });
    
    if (error) {
      console.error("Error creating client activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in createClientActivity:", error);
    return false;
  }
};

/**
 * Retrieves client activities for a specific client
 */
export const getClientActivities = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from("client_activities")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching client activities:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getClientActivities:", error);
    return [];
  }
};
