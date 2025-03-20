
import { supabase } from "@/integrations/supabase/client";
import { ExtendedActivityType } from "@/types/extended-supabase";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { callRpcFunction } from "@/utils/rpcUtils";

// Log client activity to client_activities table
export const logClientActivity = async (
  clientId: string,
  activityType: ExtendedActivityType,
  description: string,
  metadata?: Json
): Promise<unknown> => {
  if (!clientId) {
    console.warn("Client ID is required for logging activities");
    return null;
  }

  try {
    // Use RPC function via the generic function for better type safety
    const data = await callRpcFunction('log_client_activity', {
      p_client_id: clientId,
      p_activity_type: activityType,
      p_description: description,
      p_metadata: metadata || {}
    });

    return data;
  } catch (error) {
    console.error("Error in logClientActivity:", error);
    return null;
  }
};

// Compatibility function for older code
export const createClientActivity = logClientActivity;

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
        ...(metadata || {} as Record<string, Json>)
      }
    );
  } catch (error) {
    console.error("Failed to log agent error:", error);
  }
};
