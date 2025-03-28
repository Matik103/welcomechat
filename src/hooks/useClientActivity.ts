
import { ActivityType } from "@/types/activity";

export const useClientActivity = () => {
  /**
   * Create a client activity in the console log only (avoiding database)
   * This prevents the 'invalid input value for enum activity_type' error
   */
  const createClientActivity = async (
    clientId: string,
    clientName: string | undefined,
    type: ActivityType | string,
    description: string,
    metadata: any = {}
  ) => {
    // Log to console only - DO NOT insert to database
    console.log(`[Activity Log] ${type}:`, {
      client_id: clientId,
      client_name: clientName,
      description,
      metadata,
      created_at: new Date().toISOString(),
      type
    });
    
    // Return success since we're just logging
    return { success: true, error: null };
  };

  /**
   * Log client activity without database operations
   */
  const logClientActivity = async (
    clientId?: string,
    clientName?: string,
    type: ActivityType | string = "unknown",
    description: string = "Client activity",
    metadata: any = {}
  ) => {
    if (!clientId) {
      console.warn("Cannot log client activity: No client ID provided");
      return;
    }

    try {
      // Just log to console and don't attempt to write to database
      await createClientActivity(
        clientId,
        clientName,
        type,
        description,
        metadata
      );
    } catch (error) {
      console.error("Error logging client activity:", error);
    }
  };

  return {
    createClientActivity,
    logClientActivity,
  };
};
