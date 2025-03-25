
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityType, ExtendedActivityType } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunction } from '@/utils/rpcUtils';

export const useClientActivity = (clientId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logClientActivity = useCallback(
    async (
      activity_type: ActivityType | ExtendedActivityType,
      description: string,
      metadata?: Record<string, any>
    ) => {
      if (!clientId) {
        console.warn('No client ID provided for activity logging');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use callRpcFunction with proper activity type handling
        const result = await callRpcFunction('log_client_activity', {
          client_id_param: clientId,
          activity_type_param: activity_type,
          description_param: description,
          metadata_param: metadata || {}
        });
        
        return result;
      } catch (err) {
        console.error('Error logging client activity:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [clientId]
  );

  return { logClientActivity, isLoading, error };
};
