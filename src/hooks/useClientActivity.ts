
import { useState, useCallback } from 'react';
import { ActivityType, ActivityTypeString } from '@/types/activity';
import { createActivity } from '@/services/activitiesService';
import { supabase } from '@/integrations/supabase/client';

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
      // If no client_name is provided in metadata, try to fetch it
      if (!metadata.client_name) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('client_name')
          .eq('id', clientId)
          .single();
          
        if (clientData?.client_name) {
          metadata.client_name = clientData.client_name;
        }
      }
      
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
