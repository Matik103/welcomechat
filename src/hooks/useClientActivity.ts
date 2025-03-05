
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

export const useClientActivity = (clientId: string | undefined) => {
  const logClientActivity = async (activity_type: ActivityType, description: string, metadata: Json = {}) => {
    if (!clientId) return;
    
    try {
      await supabase.from("client_activities").insert({
        client_id: clientId,
        activity_type,
        description,
        metadata
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  return { logClientActivity };
};
