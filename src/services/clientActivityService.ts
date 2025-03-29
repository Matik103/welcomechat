
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ActivityTypeString } from "@/types/activity";
import { getSafeActivityType } from "@/utils/activityTypeUtils";

/**
 * Create a client activity record for tracking actions
 */
export const createClientActivity = async (
  clientId: string,
  clientName: string | undefined,
  type: ActivityType | ActivityTypeString,
  description: string,
  metadata: any = {}
): Promise<{ success: boolean; error: any | null }> => {
  try {
    // Convert the ActivityType enum to a string value acceptable by the database
    const safeActivityType = getSafeActivityType(typeof type === 'string' ? type : String(type));
    
    // Ensure we have a client name, even if it's a placeholder
    const safeClientName = clientName || "Unknown Client";
    
    // Insert activity record into the activities table
    const { error } = await supabase
      .from('activities')
      .insert({
        ai_agent_id: clientId,
        type: safeActivityType as ActivityTypeString,
        description,
        metadata: {
          ...metadata,
          client_name: safeClientName
        },
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error creating client activity:", error);
      
      // Log to console as fallback
      console.log(`[Activity Log] ${type}:`, {
        client_id: clientId,
        client_name: safeClientName,
        description,
        metadata,
        created_at: new Date().toISOString(),
        type: safeActivityType
      });
      
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Error creating client activity:", error);
    return { success: false, error };
  }
};
