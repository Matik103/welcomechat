
import { supabase } from "@/integrations/supabase/client";
import { ExtendedActivityType } from "@/types/extended-supabase";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { execSql } from "@/utils/rpcUtils";

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
    // Use RPC function instead of direct insert
    const { data, error } = await supabase.rpc('log_client_activity', {
      p_client_id: clientId,
      p_activity_type: activityType,
      p_description: description,
      p_metadata: metadata || {}
    } as any); // Use type assertion to bypass RPC function lookup errors

    if (error) {
      console.error("Error logging client activity:", error);
      return null;
    }

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
        ...(metadata || {})
      }
    );
  } catch (error) {
    console.error("Failed to log agent error:", error);
  }
};
