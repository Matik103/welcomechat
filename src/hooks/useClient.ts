
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
    staleTime: 300000, // Increase stale time to 5 minutes to reduce unnecessary refetches
    cacheTime: 600000, // Increase cache time to 10 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Prevent automatic refetches when window regains focus
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

      // Try to get the agent config by ID match directly
      const { data: agentByDirectId, error: agentByDirectIdError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', id)  
        .eq('interaction_type', 'config')
        .maybeSingle();
        
      if (agentByDirectId && !agentByDirectIdError) {
        console.log("Found client data in ai_agents table by direct ID match:", agentByDirectId);
        
        // Extract widget settings from the agent config
        const widgetSettings = extractWidgetSettings(agentByDirectId);

        // Create a properly typed client object from the agent config
        const clientFromAgent: Client = {
          id: id,
          client_id: agentByDirectId.client_id || id,
          client_name: agentByDirectId.client_name || '',
          email: agentByDirectId.email || '',
          company: agentByDirectId.company || '',
          description: agentByDirectId.description || '',
          status: agentByDirectId.status || 'active',
          created_at: agentByDirectId.created_at || new Date().toISOString(),
          updated_at: agentByDirectId.updated_at || new Date().toISOString(),
          deleted_at: agentByDirectId.deleted_at || null,
          deletion_scheduled_at: agentByDirectId.deletion_scheduled_at || null,
          last_active: agentByDirectId.last_active || null,
          logo_url: agentByDirectId.logo_url || '',
          logo_storage_path: agentByDirectId.logo_storage_path || '',
          agent_name: agentByDirectId.name || '',
          agent_description: agentByDirectId.agent_description || '',
          widget_settings: widgetSettings,
          is_error: false,
          name: agentByDirectId.name || '',
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
        logo_url: clientDataAny.logo_url || '',
        logo_storage_path: clientDataAny.logo_storage_path || '',
        agent_name: clientDataAny.agent_name || clientDataAny.client_name || '',
        agent_description: clientDataAny.agent_description || '',
        widget_settings: {},
        is_error: clientDataAny.is_error || false,
        name: clientDataAny.agent_name || clientDataAny.client_name || '',
      };

      // Extract widget settings
      const widgetSettings = extractWidgetSettings(clientDataAny);

      return {
        ...mergedClient,
        widget_settings: widgetSettings
      };
    },
    ...queryOptions,
  });

  return { client, isLoading, error, refetch };
};
