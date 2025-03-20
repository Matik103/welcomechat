
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { ExtendedActivityType } from "@/types/activity";

export const createClientActivity = async (
  clientId: string,
  activity_type: ExtendedActivityType,
  description: string,
  metadata?: Json
): Promise<void> => {
  try {
    await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type,
      description,
      metadata: metadata || {}
    });
  } catch (error) {
    console.error("Error creating activity log:", error);
    // Swallow the error as logging failure shouldn't break the app
  }
};
