
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";

/**
 * Create a client activity record for tracking actions
 */
export const createClientActivity = async (
  clientId: string,
  clientName: string | undefined,
  type: ActivityType | string,
  description: string,
  metadata: any = {}
): Promise<{ success: boolean; error: any | null }> => {
  try {
    // Insert activity record into the activities table
    const { error } = await supabase
      .from('activities')
      .insert({
        ai_agent_id: clientId,
        type: type as string, // Cast to string to avoid TypeScript errors
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
