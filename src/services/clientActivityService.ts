
import { supabase } from "@/integrations/supabase/client";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

export const createClientActivity = async (
  agentId: string,
  activity_type: ExtendedActivityType,
  description: string,
  metadata: Json = {}
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("client_activities")
      .insert({
        client_id: agentId, // This column name stays the same in client_activities table
        activity_type,
        description,
        metadata
      });

    if (error) {
      console.error("Error creating client activity:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in createClientActivity:", error);
    throw error;
  }
};
