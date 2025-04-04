
import { ActivityType, ActivityTypeString } from "@/types/activity";
import { createClientActivity } from "@/services/clientActivityService";

export const useClientActivities = () => {
  /**
   * Log client activity without database operations
   */
  const logClientActivity = async (
    clientId?: string,
    clientName?: string,
    type: ActivityType | ActivityTypeString = ActivityType.CLIENT_UPDATED,
    description: string = "Client activity",
    metadata: any = {}
  ) => {
    if (!clientId) {
      console.warn("Cannot log client activity: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }

    try {
      return await createClientActivity(
        clientId,
        clientName || "",
        type,
        description,
        metadata
      );
    } catch (error) {
      console.error("Error logging client activity:", error);
      return { success: false, error };
    }
  };

  return {
    createClientActivity,
    logClientActivity,
  };
};
