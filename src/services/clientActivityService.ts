
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ActivityTypeString } from "@/types/activity";

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
    // Need to use type assertion to match the exact enum types in the database
    const activityType = typeof type === 'string' ? type : type;
    
    // Insert activity record into the activities table
    const { error } = await supabase
      .from('activities')
      .insert({
        ai_agent_id: clientId,
        type: activityType,
        description,
        metadata: {
          ...metadata,
          client_name: clientName
        },
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error creating client activity:", error);
      
      // Log to console as fallback
      console.log(`[Activity Log] ${type}:`, {
        client_id: clientId,
        client_name: clientName,
        description,
        metadata,
        created_at: new Date().toISOString(),
        type
      });
      
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Error creating client activity:", error);
    return { success: false, error };
  }
};
