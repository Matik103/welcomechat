
import { supabase } from "@/integrations/supabase/client";
import { ExtendedActivityType } from "@/types/extended-supabase";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

// Log client activity to client_activities table
export const logClientActivity = async (
  clientId: string,
  activityType: ExtendedActivityType,
  description: string,
  metadata?: Json
): Promise<null> => {
  try {
    // Use RPC rather than insert to avoid type mismatches
    const { data, error } = await supabase.rpc('log_client_activity', {
      p_client_id: clientId,
      p_activity_type: activityType,
      p_description: description,
      p_metadata: metadata || {}
    });

    if (error) {
      console.error("Error logging client activity:", error);
      throw error;
    }

    return null;
  } catch (error) {
    console.error("Error in logClientActivity:", error);
    return null;
  }
};

// Log error specific to an agent
export const logAgentError = async (
  clientId: string,
  errorType: string,
  errorMessage: string,
  metadata?: Json
): Promise<void> => {
  try {
    await logClientActivity(
      clientId,
      'error_logged',
      `Error: ${errorType}`,
      {
        error_type: errorType,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    );
  } catch (error) {
    console.error("Failed to log agent error:", error);
  }
};
