
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

// Add this function for documentProcessingService.ts
export const logAgentError = async (
  agentId: string,
  errorType: string,
  errorMessage: string,
  metadata: Json = {}
): Promise<void> => {
  try {
    await createClientActivity(
      agentId,
      "agent_error",
      `Error: ${errorType} - ${errorMessage.substring(0, 100)}`,
      {
        error_type: errorType,
        error_message: errorMessage,
        ...metadata
      }
    );
  } catch (error) {
    console.error("Failed to log agent error:", error);
  }
};
