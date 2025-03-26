
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/client-form";

export const logClientActivity = async (
  clientId: string,
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: activityType,
      description,
      metadata
    });
  } catch (error) {
    console.error("Error logging client activity:", error);
  }
};
