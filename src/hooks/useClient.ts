
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { extractWidgetSettings } from '@/utils/widgetSettingsUtils';

interface UseClientOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  refetchOnWindowFocus?: boolean;
}

export const useClient = (id: string, options?: UseClientOptions) => {
  const defaultOptions = {
    enabled: !!id,
    staleTime: 60000,
    cacheTime: 120000,
    retry: 2,
    refetchOnWindowFocus: false,
  };

  const queryOptions = { ...defaultOptions, ...options };

  const {
    data: client,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) throw new Error('Client ID is required');

      // First get the client data
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!clientData) throw new Error(`Client not found with ID: ${id}`);

      // Now get the agent config data
      const { data: agentConfig, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', id)
        .eq('interaction_type', 'config')
        .maybeSingle();

      if (agentError) {
        console.error('Error fetching agent config:', agentError);
        // Continue anyway, this is non-blocking
      }

      // Merge the data from both sources
      const mergedClient: Client = {
        id: clientData.id,
        client_id: clientData.id,
        client_name: clientData.client_name,
        email: clientData.email,
        status: clientData.status,
        created_at: clientData.created_at,
        updated_at: clientData.updated_at,
        agent_name: agentConfig?.name || clientData.agent_name || clientData.client_name,
        agent_description: agentConfig?.agent_description || '',
        logo_url: agentConfig?.logo_url || '',
        logo_storage_path: agentConfig?.logo_storage_path || '',
      };

      // Extract widget settings
      const widgetSettings = extractWidgetSettings(
        agentConfig || clientData
      );

      return {
        ...mergedClient,
        widget_settings: widgetSettings
      };
    },
    ...queryOptions,
  });

  return { client, isLoading, error, refetch };
};
