
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { mapActivityType } from "@/utils/activityTypeUtils";
import { createClientActivity, ensureUserRole } from "@/services/clientActivityService";

export const useClientActivity = (clientId: string | undefined) => {
  /**
   * Logs client activity with enhanced error handling
   */
  const logClientActivity = async (
    activity_type: ExtendedActivityType, 
    description: string, 
    metadata: Json = {}
  ): Promise<void> => {
    if (!clientId) {
      console.warn("Cannot log activity: No client ID provided");
      return;
    }
    
    try {
      // Map the activity type and enhance metadata if needed
      const { dbActivityType, enhancedMetadata } = mapActivityType(activity_type, metadata);
      
      // Create the activity record
      await createClientActivity(clientId, dbActivityType, description, enhancedMetadata);
    } catch (error) {
      // Enhanced error logging
      console.error("Failed to log client activity:", {
        error,
        clientId,
        activity_type,
        description
      });
      
      // We don't rethrow the error to prevent UI disruption,
      // but this could be modified based on requirements
    }
  };

  /**
   * Ensures a user role exists for the given user
   */
  const ensureClientRole = async (userId: string): Promise<void> => {
    if (!clientId) {
      console.warn("Cannot ensure client role: No client ID provided");
      return;
    }
    
    try {
      await ensureUserRole(userId, "client", clientId);
    } catch (error) {
      console.error("Failed to ensure client role:", error);
      // Don't rethrow to prevent UI disruption
    }
  };

  return { logClientActivity, ensureClientRole };
};
