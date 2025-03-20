
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { ExtendedActivityType } from "@/types/activity";

/**
 * Creates a client activity entry in the database
 * @param clientId The client ID
 * @param activityType The type of activity
 * @param description A description of the activity
 * @param metadata Additional metadata about the activity
 * @returns The created activity
 */
export const createClientActivity = async (
  clientId: string,
  activityType: ExtendedActivityType,
  description: string,
  metadata: Record<string, any> = {}
): Promise<any> => {
  try {
    console.log(`Creating activity for client ${clientId}: ${activityType} - ${description}`);
    
    // Convert metadata to proper Json type
    const metadataJson: Json = metadata as Json;
    
    const { data, error } = await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: activityType,
        description,
        metadata: metadataJson
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Error creating client activity:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createClientActivity:", error);
    return null;
  }
};
