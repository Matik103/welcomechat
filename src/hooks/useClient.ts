
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
      
      console.log(`Fetching client with ID: ${id}`);

      // First check if the ID exists in the ai_agents table with interaction_type = 'config'
      const { data: agentConfig, error: agentConfigError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', id)
        .eq('interaction_type', 'config')
        .maybeSingle();

      // If we found a record in ai_agents table, use that as primary source
      if (agentConfig && !agentConfigError) {
        console.log("Found client data in ai_agents table:", agentConfig);
        
        // Extract widget settings from the agent config
        const widgetSettings = extractWidgetSettings(agentConfig);

        // Create a properly typed client object from the agent config
        const clientFromAgent: Client = {
          id: id,
          client_id: id,
          client_name: agentConfig.client_name || '',
          email: agentConfig.email || '',
          company: agentConfig.company || '',
          description: agentConfig.description || '',
          status: agentConfig.status || 'active',
          created_at: agentConfig.created_at || new Date().toISOString(),
          updated_at: agentConfig.updated_at || new Date().toISOString(),
          deleted_at: agentConfig.deleted_at || null,
          deletion_scheduled_at: agentConfig.deletion_scheduled_at || null,
          last_active: agentConfig.last_active || null,
          logo_url: agentConfig.logo_url || '',
          logo_storage_path: agentConfig.logo_storage_path || '',
          agent_name: agentConfig.name || '',
          agent_description: agentConfig.agent_description || '',
          widget_settings: widgetSettings,
          is_error: false,
          name: agentConfig.name || '',
        };

        return clientFromAgent;
      }

      // As a fallback, try to get the client data from clients table
      console.log("No record found in ai_agents table, falling back to clients table");
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching client data:", error);
        throw error;
      }
      
      if (!clientData) {
        console.error(`Client not found with ID: ${id}`);
        throw new Error(`Client not found with ID: ${id}`);
      }

      console.log("Client data found in clients table:", clientData);

      // Try to get the agent config data again based on ID
      const { data: secondaryAgentConfig, error: secondaryAgentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', id)  // Try matching by id field directly
        .eq('interaction_type', 'config')
        .maybeSingle();
        
      if (secondaryAgentConfig && !secondaryAgentError) {
        console.log("Found agent config by direct ID match:", secondaryAgentConfig);
      }

      // Type assertion to help TypeScript - cast to any since we know the DB may return fields
      // that aren't explicitly in the clients table schema type
      const clientDataAny = clientData as any;

      // Create a properly typed client object with optional fallbacks
      const mergedClient: Client = {
        id: clientDataAny.id,
        client_id: clientDataAny.id,
        client_name: clientDataAny.client_name || '',
        email: clientDataAny.email || '',
        company: clientDataAny.company || '', 
        description: clientDataAny.description || '',
        status: clientDataAny.status || 'active',
        created_at: clientDataAny.created_at || new Date().toISOString(),
        updated_at: clientDataAny.updated_at || new Date().toISOString(),
        deleted_at: clientDataAny.deleted_at || null,
        deletion_scheduled_at: clientDataAny.deletion_scheduled_at || null,
        last_active: clientDataAny.last_active || null,
        logo_url: secondaryAgentConfig?.logo_url || clientDataAny.logo_url || '',
        logo_storage_path: secondaryAgentConfig?.logo_storage_path || clientDataAny.logo_storage_path || '',
        agent_name: secondaryAgentConfig?.name || clientDataAny.agent_name || clientDataAny.client_name || '',
        agent_description: secondaryAgentConfig?.agent_description || '',
        widget_settings: {},
        is_error: clientDataAny.is_error || false,
        name: secondaryAgentConfig?.name || clientDataAny.agent_name || clientDataAny.client_name || '',
      };

      // Extract widget settings
      const widgetSettings = extractWidgetSettings(
        secondaryAgentConfig || clientDataAny
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
