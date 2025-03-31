
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

        // Parse settings to ensure it's a proper object
        const parsedSettings = safeParseSettings(agentConfig.settings);

        // Merge the data with priority to ai_agents table data
        const mergedClient: Client = {
          id: id,
          client_id: id,
          client_name: agentConfig.client_name || clientData?.client_name || '',
          email: agentConfig.email || clientData?.email || '',
          status: clientData?.status || 'active',
          created_at: agentConfig.created_at || clientData?.created_at || new Date().toISOString(),
          updated_at: agentConfig.updated_at || clientData?.updated_at || new Date().toISOString(),
          agent_name: agentConfig.name || clientData?.agent_name || '',
          agent_description: agentConfig.agent_description || '',
          logo_url: agentConfig.logo_url || '',
          logo_storage_path: agentConfig.logo_storage_path || '',
          // Add missing required fields from Client type with fallbacks
          company: parsedSettings.company || clientData?.company || '',
          description: parsedSettings.description || agentConfig.description || clientData?.description || '',
          deleted_at: parsedSettings.deleted_at || agentConfig.deleted_at || clientData?.deleted_at || null,
          deletion_scheduled_at: parsedSettings.deletion_scheduled_at || agentConfig.deletion_scheduled_at || clientData?.deletion_scheduled_at || null,
          last_active: parsedSettings.last_active || agentConfig.last_active || clientData?.last_active || null,
          widget_settings: parsedSettings || {},
          name: agentConfig.name || clientData?.agent_name || '',
          is_error: false,
          user_id: parsedSettings.user_id || undefined
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

      // Parse widget_settings to ensure it's a proper object
      const parsedWidgetSettings = safeParseSettings(clientData.widget_settings);

      // Simple client record without agent details
      const basicClient: Client = {
        id: clientData.id,
        client_id: clientData.id,
        client_name: clientData.client_name || '',
        email: clientData.email || '',
        status: clientData.status || 'active',
        created_at: clientData.created_at || new Date().toISOString(),
        updated_at: clientData.updated_at || new Date().toISOString(),
        agent_name: clientData.agent_name || clientData.client_name || '',
        agent_description: parsedWidgetSettings.agent_description || '',
        logo_url: parsedWidgetSettings.logo_url || '',
        logo_storage_path: parsedWidgetSettings.logo_storage_path || '',
        // Add missing required fields from Client type with fallbacks
        company: parsedWidgetSettings.company || '',
        description: parsedWidgetSettings.description || '',
        deleted_at: parsedWidgetSettings.deleted_at || null,
        deletion_scheduled_at: parsedWidgetSettings.deletion_scheduled_at || null,
        last_active: parsedWidgetSettings.last_active || null,
        widget_settings: parsedWidgetSettings,
        name: clientData.agent_name || clientData.client_name || '',
        is_error: false,
        user_id: parsedWidgetSettings.user_id || undefined
      };

      // Extract widget settings
      const extractedWidgetSettings = extractWidgetSettings(clientData);

      return {
        ...basicClient,
        widget_settings: extractedWidgetSettings
      };
    },
    ...queryOptions,
  });

  return { client, isLoading, error, refetch };
};
