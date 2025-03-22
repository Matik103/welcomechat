
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExtendedActivityType } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';
import { callRpcFunction } from '@/utils/rpcUtils';
import { useClient } from './useClient';

export const useClientActivity = (clientId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useClient(clientId || '');

  const logClientActivity = useCallback(
    async (
      activity_type: ExtendedActivityType,
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
        // Enrich metadata with client information
        const enrichedMetadata = {
          ...metadata || {},
          client_name: client?.client_name || metadata?.client_name,
          agent_name: client?.name || client?.agent_name || metadata?.agent_name
        };

        console.log("Logging activity with enriched metadata:", enrichedMetadata);
        
        // Use callRpcFunction instead of direct RPC call to bypass type checking
        const result = await callRpcFunction('log_client_activity', {
          client_id_param: clientId,
          activity_type_param: activity_type,
          description_param: description,
          metadata_param: enrichedMetadata
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
    [clientId, client]
  );

  return { logClientActivity, isLoading, error };
};
