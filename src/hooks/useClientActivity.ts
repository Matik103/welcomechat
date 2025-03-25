
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/client-form';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunction } from '@/utils/rpcUtils';
import { createClientActivity } from '@/services/clientActivityService';

export const useClientActivity = (clientId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logClientActivity = useCallback(
    async (
      activity_type: ActivityType,
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
        const result = await createClientActivity(
          clientId,
          activity_type,
          description,
          metadata || {}
        );
        
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

export default useClientActivity;
