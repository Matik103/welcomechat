
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { ExtendedActivityType, ActivityType } from "@/types/activity";
import { mapActivityType } from "@/utils/activityTypeUtils";

export const createClientActivity = async (
  clientId: string,
  activity_type: ExtendedActivityType,
  description: string,
  metadata?: Json
): Promise<void> => {
  try {
    // Map the extended activity type to a database-compatible activity type
    const { dbActivityType, enhancedMetadata } = mapActivityType(activity_type, metadata);
    
    // Create the record with the mapped activity type
    const { error } = await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: dbActivityType,
      description,
      metadata: enhancedMetadata || {}
    });
    
    if (error) {
      console.error("Error inserting client activity:", error);
    }
  } catch (error) {
    console.error("Error creating activity log:", error);
    // Swallow the error as logging failure shouldn't break the app
  }
};

// Add logAgentError function that's being imported in documentProcessingService.ts
export const logAgentError = async (
  clientId: string,
  agentName: string,
  errorType: string,
  errorMessage: string,
  context: string,
  metadata?: Json
): Promise<void> => {
  try {
    let errorMetadata: Record<string, any> = {};
    if (metadata && typeof metadata === 'object') {
      errorMetadata = { ...metadata };
    }
    
    errorMetadata.agent_name = agentName;
    errorMetadata.error_type = errorType;
    errorMetadata.context = context;
    
    await createClientActivity(
      clientId,
      'agent_error',
      errorMessage,
      errorMetadata as Json
    );
    
    console.error(`Agent error (${errorType}): ${errorMessage}`);
  } catch (error) {
    console.error("Failed to log agent error:", error);
  }
};
