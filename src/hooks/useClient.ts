
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

      console.log('Fetching client with ID:', id);

      // First try to get the client data from ai_agents table with interaction_type='config'
      const { data: agentConfig, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', id)
        .eq('interaction_type', 'config')
        .maybeSingle();

      // If found in ai_agents, use that as primary source
      if (agentConfig && !agentError) {
        console.log('Found client in ai_agents table:', agentConfig);
        
        // Now get the client data for any additional fields
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .maybeSingle();
          
        if (clientError) console.error('Error fetching client data:', clientError);

        // Merge the data with priority to ai_agents table data
        const mergedClient: Client = {
          id: id,
          client_id: id,
          client_name: clientData?.client_name || agentConfig.client_name || '',
          email: clientData?.email || agentConfig.email || '',
          status: clientData?.status || 'active',
          created_at: agentConfig.created_at || clientData?.created_at,
          updated_at: agentConfig.updated_at || clientData?.updated_at,
          agent_name: agentConfig.name || clientData?.agent_name || '',
          agent_description: agentConfig.agent_description || '',
          logo_url: agentConfig.logo_url || '',
          logo_storage_path: agentConfig.logo_storage_path || '',
          // Add missing required fields from Client type
          company: clientData?.company || '',
          description: clientData?.description || '',
          deleted_at: clientData?.deleted_at || null,
          deletion_scheduled_at: clientData?.deletion_scheduled_at || null,
          last_active: clientData?.last_active || null,
          widget_settings: clientData?.widget_settings || {},
          name: agentConfig.name || clientData?.agent_name || '',
          is_error: false,
          user_id: clientData?.user_id
        };

        // Extract widget settings
        const widgetSettings = extractWidgetSettings(agentConfig);

        return {
          ...mergedClient,
          widget_settings: widgetSettings
        };
      }

      // Fallback to clients table if not found in ai_agents
      console.log('Falling back to clients table');
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!clientData) throw new Error(`Client not found with ID: ${id}`);

      // Simple client record without agent details
      const basicClient: Client = {
        id: clientData.id,
        client_id: clientData.id,
        client_name: clientData.client_name,
        email: clientData.email,
        status: clientData.status,
        created_at: clientData.created_at,
        updated_at: clientData.updated_at,
        agent_name: clientData.agent_name || clientData.client_name,
        agent_description: '',
        logo_url: '',
        logo_storage_path: '',
        // Add missing required fields from Client type
        company: clientData.company || '',
        description: clientData.description || '',
        deleted_at: clientData.deleted_at || null,
        deletion_scheduled_at: clientData.deletion_scheduled_at || null,
        last_active: clientData.last_active || null,
        widget_settings: clientData.widget_settings || {},
        name: clientData.agent_name || clientData.client_name,
        is_error: false,
        user_id: clientData.user_id
      };

      // Extract widget settings
      const widgetSettings = extractWidgetSettings(clientData);

      return {
        ...basicClient,
        widget_settings: widgetSettings
      };
    },
    ...queryOptions,
  });

  return { client, isLoading, error, refetch };
};
