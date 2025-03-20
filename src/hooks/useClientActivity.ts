
import { useState } from "react";
import { createClientActivity } from "@/services/clientActivityService";
import { ExtendedActivityType } from "@/types/activity";
import { mapActivityType } from "@/utils/activityTypeUtils";
import { Json } from "@/integrations/supabase/types";

export const useClientActivity = (clientId: string) => {
  const [isLogging, setIsLogging] = useState(false);

  const logActivity = async (
    activityType: ExtendedActivityType,
    description: string,
    metadata: Json = {}
  ): Promise<void> => {
    if (!clientId) return;

    setIsLogging(true);
    try {
      await createClientActivity(clientId, activityType, description, metadata);
    } catch (error) {
      console.error(`Error logging activity ${activityType}:`, error);
    } finally {
      setIsLogging(false);
    }
  };

  return {
    logActivity,
    isLogging
  };
};
