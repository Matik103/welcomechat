
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

      // First get the client data
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

      console.log("Client data found:", clientData);

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

      console.log("Agent config data:", agentConfig);

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
        logo_url: agentConfig?.logo_url || clientDataAny.logo_url || '',
        logo_storage_path: agentConfig?.logo_storage_path || clientDataAny.logo_storage_path || '',
        agent_name: agentConfig?.name || clientDataAny.agent_name || clientDataAny.client_name || '',
        agent_description: agentConfig?.agent_description || '',
        widget_settings: {},
        is_error: clientDataAny.is_error || false,
        name: agentConfig?.name || clientDataAny.agent_name || clientDataAny.client_name || '',
      };

      // Extract widget settings
      const widgetSettings = extractWidgetSettings(
        agentConfig || clientDataAny
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
