
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClientActivity } from '@/services/clientActivityService';
import { toast } from 'sonner';
import { ActivityType, ActivityTypeString } from '@/types/activity';

export function useClientActivity(clientId?: string) {
  const { user } = useAuth();
  const [isLogging, setIsLogging] = useState(false);

  console.log("useClientActivity initialized with clientId:", clientId);
  console.log("Current user metadata:", user?.user_metadata);

  const logClientActivity = async (
    activityType: ActivityType | ActivityTypeString = 'page_view',
    description: string = 'Client viewed page',
    activityData: Record<string, any> = {}
  ): Promise<void> => {
    // If we don't have a clientId, try to get it from the user's metadata
    const effectiveClientId = clientId || user?.user_metadata?.client_id;
    
    console.log("Logging client activity:", { 
      effectiveClientId, 
      activityType, 
      description 
    });
    
    if (!effectiveClientId) {
      console.error("Cannot log activity: No client ID available");
      return;
    }

    setIsLogging(true);
    
    try {
      await createClientActivity(
        effectiveClientId,
        undefined as any, // Agent name is optional
        activityType,
        description,
        activityData
      );
      
      console.log("Activity logged successfully");
    } catch (error) {
      console.error("Failed to log client activity:", error);
      // Don't show toast for every activity log failure
      if (activityType !== 'page_view') {
        toast.error("Failed to log activity");
      }
    } finally {
      setIsLogging(false);
    }
  };

  return { logClientActivity, isLogging };
}
