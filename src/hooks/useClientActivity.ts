
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ExtendedActivityType, ActivityRecord } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

export const useClientActivity = (clientId: string | undefined) => {
  const logClientActivity = async (activity_type: ExtendedActivityType, description: string, metadata: Json = {}) => {
    if (!clientId) return;
    
    try {
      // Map custom activity types to valid enum values if needed
      let dbActivityType: ActivityType;
      
      // Handle special cases that aren't in the database enum
      switch (activity_type) {
        case "ai_agent_created":
        case "ai_agent_updated":
        case "logo_uploaded":
        case "embed_code_copied":
        case "widget_previewed":
          // Map to a valid enum type that's closest in meaning
          dbActivityType = "client_updated";
          
          // Store the original activity type in metadata for reference
          // Make sure metadata is an object before spreading
          const metadataObj = typeof metadata === 'object' && metadata !== null 
            ? metadata 
            : {};
            
          metadata = {
            ...metadataObj,
            original_activity_type: activity_type
          } as Json;
          break;
        default:
          // For all other cases, use the activity type directly
          dbActivityType = activity_type as ActivityType;
      }
      
      // Create the activity record in the database
      const { error } = await supabase.from("client_activities").insert({
        client_id: clientId,
        activity_type: dbActivityType,
        description,
        metadata
      });
      
      if (error) {
        console.error("Failed to log activity:", error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  return { logClientActivity };
};
