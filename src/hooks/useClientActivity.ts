
import { ActivityType } from "@/types/activity";
import { supabase } from "@/integrations/supabase/client";

// Safe activity types that match the database enum
const SAFE_ACTIVITY_TYPES = [
  "document_added",
  "document_removed",
  "document_processed",
  "document_processing_failed",
  "url_added",
  "url_removed",
  "url_processed",
  "url_processing_failed",
  "chat_message_sent",
  "chat_message_received",
  "client_created",
  "client_updated",
  "client_deleted"
];

export const useClientActivity = (clientId?: string) => {
  /**
   * Create a client activity in the database with safe enum values
   */
  const createClientActivity = async (
    clientId: string,
    clientName: string | undefined,
    type: ActivityType,
    description: string,
    metadata: any = {}
  ) => {
    // Map any potentially unsafe activity types to safe ones
    let safeType: ActivityType = "client_updated";
    
    // Only use the provided type if it's in our safe list
    if (SAFE_ACTIVITY_TYPES.includes(type as string)) {
      safeType = type;
    } else {
      console.warn(`Activity type "${type}" is not in the safe list, using "client_updated" instead`);
    }
    
    try {
      // Create a direct record in the ai_agents table to avoid enum issues
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          client_id: clientId,
          client_name: clientName,
          interaction_type: 'activity_log',
          name: 'Activity Logger',
          type: safeType,
          content: description,
          metadata: metadata,
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
   * Log client activity with fallback to safe activity type
   */
  const logClientActivity = async (
    type: ActivityType = "client_updated",
    description: string = "Client activity",
    metadata: any = {}
  ) => {
    if (!clientId) {
      console.warn("Cannot log client activity: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }

    try {
      // Use a safe default if the provided type is not in our safe list
      const safeType = SAFE_ACTIVITY_TYPES.includes(type as string) 
        ? type 
        : "client_updated";
      
      return await createClientActivity(
        clientId,
        undefined, // clientName can be undefined
        safeType,
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
