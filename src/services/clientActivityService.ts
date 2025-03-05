
import { supabase } from "@/integrations/supabase/client";
import { ActivityType, ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

/**
 * Creates a client activity record in the database
 */
export const createClientActivity = async (
  clientId: string,
  activityType: ActivityType,
  description: string,
  metadata: Json = {}
): Promise<void> => {
  try {
    const { error } = await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: activityType,
      description,
      metadata
    });
    
    if (error) {
      console.error("Failed to log activity:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error creating client activity:", error);
    throw error;
  }
};
