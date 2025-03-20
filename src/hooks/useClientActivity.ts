
import { useState } from "react";
import { createClientActivity } from "@/services/clientActivityService";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

export const useClientActivity = (agentId: string) => {
  const [isLogging, setIsLogging] = useState(false);

  const logActivity = async (
    activityType: ExtendedActivityType,
    description: string,
    metadata: Json = {}
  ): Promise<void> => {
    if (!agentId) return;

    setIsLogging(true);
    try {
      await createClientActivity(agentId, activityType, description, metadata);
    } catch (error) {
      console.error(`Error logging activity ${activityType}:`, error);
    } finally {
      setIsLogging(false);
    }
  };

  // Add alias for backward compatibility
  const logClientActivity = logActivity;

  return {
    logActivity,
    logClientActivity, // Add this alias to maintain compatibility with existing code
    isLogging
  };
};
