
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { extractWidgetSettings } from '@/utils/widgetSettingsUtils';
import { safeParseSettings } from '@/utils/clientSettingsUtils';

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
    staleTime: 0, // No stale time to ensure fresh data
    cacheTime: 60000, // 1 minute cache
    retry: 3,
    refetchOnWindowFocus: true,
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

      console.log('Fetching client with ID:', id);

      // Get the client data from ai_agents table using client_id
      let { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', id)
        .eq('interaction_type', 'config')
        .maybeSingle();

      if (agentError) {
        console.error('Error fetching from ai_agents:', agentError);
        throw new Error(`Failed to fetch client data: ${agentError.message}`);
      }

      if (!agentData) {
        // Try with direct id match as fallback
        const { data: directData, error: directError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (directError || !directData) {
          console.error('Error fetching client:', directError || 'No data found');
          throw new Error(`Client not found with ID: ${id}`);
        }

        agentData = directData;
      }

      // Parse settings
      const parsedSettings = safeParseSettings(agentData.settings);
      const widgetSettings = extractWidgetSettings(agentData);
      
      const client: Client = {
        id: agentData.id,
        client_id: agentData.client_id,
        client_name: agentData.client_name || parsedSettings.client_name || '',
        email: agentData.email || parsedSettings.email || '',
        company: agentData.company || parsedSettings.company || '',
        description: agentData.description || parsedSettings.description || '',
        status: agentData.status || 'active',
        created_at: agentData.created_at || new Date().toISOString(),
        updated_at: agentData.updated_at || new Date().toISOString(),
        deleted_at: agentData.deleted_at || null,
        deletion_scheduled_at: agentData.deletion_scheduled_at || null,
        last_active: agentData.last_active || null,
        user_id: parsedSettings.user_id,
        agent_name: agentData.name || '',
        agent_description: agentData.agent_description || '',
        logo_url: agentData.logo_url || '',
        logo_storage_path: agentData.logo_storage_path || '',
        widget_settings: widgetSettings,
        name: agentData.name || '',
        is_error: false,
        openai_assistant_id: agentData.openai_assistant_id,
        deepseek_assistant_id: agentData.deepseek_assistant_id
      };

      console.log('Processed client data:', client);
      return client;
    },
    ...queryOptions,
  });

  return { client, isLoading, error, refetch };
};
