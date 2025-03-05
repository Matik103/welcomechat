
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ActivityRecord } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

export const useClientActivity = (clientId: string | undefined) => {
  const logClientActivity = async (activity_type: ActivityType, description: string, metadata: Json = {}) => {
    if (!clientId) return;
    
    try {
      // Instead of creating an ActivityRecord type object and passing it directly,
      // create an object that matches what Supabase expects
      await supabase.from("client_activities").insert({
        client_id: clientId,
        activity_type: activity_type as any, // Use type assertion to bypass type checking temporarily
        description,
        metadata
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  return { logClientActivity };
};
