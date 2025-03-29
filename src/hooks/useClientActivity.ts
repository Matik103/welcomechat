
import { useState, useCallback } from 'react';
import { ActivityType, ActivityTypeString } from '@/types/activity';
import { createActivity } from '@/services/activitiesService';

export function useClientActivity(clientId?: string) {
  const [isLogging, setIsLogging] = useState(false);

  const logClientActivity = useCallback(async (
    type: ActivityType | ActivityTypeString,
    description: string,
    metadata: any = {}
  ) => {
    if (!clientId) {
      console.warn("Cannot log client activity: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }

    setIsLogging(true);
    try {
      const result = await createActivity(
        clientId,
        type,
        description,
        metadata
      );
      return result;
    } catch (error) {
      console.error("Error logging client activity:", error);
      return { success: false, error };
    } finally {
      setIsLogging(false);
    }
  }, [clientId]);

  return {
    logClientActivity,
    isLogging
  };
}
