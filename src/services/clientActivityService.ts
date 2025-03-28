
import { supabase } from "@/integrations/supabase/client";
import { ActivityType } from "@/types/activity";

/**
 * Create a client activity record for tracking actions
 * This is a stub that logs to console only to avoid database errors
 */
export const createClientActivity = async (
  clientId: string,
  clientName: string | undefined,
  type: ActivityType | string,
  description: string,
  metadata: any = {}
): Promise<{ success: boolean; error: any | null }> => {
  try {
    // Log to console only - avoiding database operations
    console.log(`[Activity Log] ${type}:`, {
      client_id: clientId,
      client_name: clientName,
      description,
      metadata,
      created_at: new Date().toISOString(),
      type
    });
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Error creating client activity:", error);
    return { success: false, error };
  }
};
