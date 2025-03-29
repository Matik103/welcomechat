
import { ActivityType, ActivityTypeString } from "@/types/activity";
import { supabase } from "@/integrations/supabase/client";

export const useClientActivity = (clientId?: string) => {
  /**
   * Create a client activity in the database with safe enum values
   */
  const createClientActivity = async (
    clientId: string,
    clientName: string | undefined,
    type: ActivityType | ActivityTypeString,
    description: string,
    metadata: any = {}
  ) => {
    // Use enum value directly since we've updated the Enum to match database values
    try {
      // Create a direct record in the activities table
      const { data, error } = await supabase
        .from('activities')
        .insert({
          ai_agent_id: clientId,
          type: type as any, // Cast to any to bypass the type checking
          description,
          metadata: {
            ...metadata,
            client_name: clientName
          },
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Error logging activity:", error);
        return { success: false, error };
      }
      
      return { success: true, data, error: null };
    } catch (err) {
      console.error("Error in createClientActivity:", err);
      return { success: false, error: err };
    }
  };

  /**
   * Log client activity with the current client ID
   */
  const logClientActivity = async (
    type: ActivityType | ActivityTypeString = ActivityType.CLIENT_UPDATED,
    description: string = "Client activity",
    metadata: any = {}
  ) => {
    if (!clientId) {
      console.warn("Cannot log client activity: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }

    try {
      return await createClientActivity(
        clientId,
        undefined, // clientName can be undefined
        type,
        description,
        metadata
      );
    } catch (error) {
      console.error("Error logging client activity:", error);
      return { success: false, error };
    }
  };

  return {
    createClientActivity,
    logClientActivity,
  };
};
