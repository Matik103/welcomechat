
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
    retry: 3,
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

      // Get the client data from ai_agents table using client_id
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', id)
        .eq('interaction_type', 'config')
        .maybeSingle();

      if (agentError) {
        console.error('Error fetching from ai_agents by client_id:', agentError);
        
        // Try fetching by direct id match as fallback
        const { data: directAgentData, error: directError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', id)
          .maybeSingle();
          
        if (directError || !directAgentData) {
          console.error('Error fetching by direct ID:', directError);
          console.error('ID attempted:', id);
          throw new Error(`Client not found with ID: ${id}`);
        }
        
        // Use direct ID match data
        const parsedSettings = safeParseSettings(directAgentData.settings);
        
        // Merge in all the required Client fields
        const client: Client = {
          id: id,
          client_id: directAgentData.client_id || id,
          client_name: directAgentData.client_name || '',
          email: directAgentData.email || '',
          status: directAgentData.status || 'active',
          created_at: directAgentData.created_at || new Date().toISOString(),
          updated_at: directAgentData.updated_at || new Date().toISOString(),
          agent_name: directAgentData.name || '',
          agent_description: directAgentData.agent_description || '',
          logo_url: directAgentData.logo_url || '',
          logo_storage_path: directAgentData.logo_storage_path || '',
          // Add missing required fields with fallbacks
          company: directAgentData.company || parsedSettings.company || '',
          description: directAgentData.description || parsedSettings.description || '',
          deleted_at: directAgentData.deleted_at || parsedSettings.deleted_at || null,
          deletion_scheduled_at: directAgentData.deletion_scheduled_at || parsedSettings.deletion_scheduled_at || null,
          last_active: directAgentData.last_active || parsedSettings.last_active || null,
          widget_settings: parsedSettings || {},
          name: directAgentData.name || '',
          is_error: false,
          user_id: parsedSettings.user_id || undefined,
          openai_assistant_id: directAgentData.openai_assistant_id || undefined
        };
        
        console.log('Found client by direct ID:', client);
        return client;
      }

      if (!agentData) {
        // Try with a different query if not found
        const { data: fallbackAgentData, error: fallbackError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', id)
          .maybeSingle();
          
        if (fallbackError || !fallbackAgentData) {
          console.error('Fallback query failed:', fallbackError);
          console.error('ID attempted:', id);
          throw new Error(`Client not found with ID: ${id}`);
        }
        
        // Use fallback data
        const parsedSettings = safeParseSettings(fallbackAgentData.settings);
        
        const client: Client = {
          id: id,
          client_id: fallbackAgentData.client_id || id,
          client_name: fallbackAgentData.client_name || '',
          email: fallbackAgentData.email || '',
          status: fallbackAgentData.status || 'active',
          created_at: fallbackAgentData.created_at || new Date().toISOString(),
          updated_at: fallbackAgentData.updated_at || new Date().toISOString(),
          agent_name: fallbackAgentData.name || '',
          agent_description: fallbackAgentData.agent_description || '',
          logo_url: fallbackAgentData.logo_url || '',
          logo_storage_path: fallbackAgentData.logo_storage_path || '',
          // Add missing required fields with fallbacks
          company: fallbackAgentData.company || parsedSettings.company || '',
          description: fallbackAgentData.description || parsedSettings.description || '',
          deleted_at: fallbackAgentData.deleted_at || parsedSettings.deleted_at || null,
          deletion_scheduled_at: fallbackAgentData.deletion_scheduled_at || parsedSettings.deletion_scheduled_at || null,
          last_active: fallbackAgentData.last_active || parsedSettings.last_active || null,
          widget_settings: parsedSettings || {},
          name: fallbackAgentData.name || '',
          is_error: false,
          user_id: parsedSettings.user_id || undefined,
          openai_assistant_id: fallbackAgentData.openai_assistant_id || undefined
        };
        
        console.log('Found client using fallback query:', client);
        return client;
      }
      
      // Successfully found in ai_agents table
      console.log('Found client in ai_agents table:', agentData);
      
      // Parse settings to ensure it's a proper object
      const parsedSettings = safeParseSettings(agentData.settings);
      
      // Create the Client object with all required fields
      const client: Client = {
        id: id,
        client_id: agentData.client_id || id,
        client_name: agentData.client_name || '',
        email: agentData.email || '',
        status: agentData.status || 'active',
        created_at: agentData.created_at || new Date().toISOString(),
        updated_at: agentData.updated_at || new Date().toISOString(),
        agent_name: agentData.name || '',
        agent_description: agentData.agent_description || '',
        logo_url: agentData.logo_url || '',
        logo_storage_path: agentData.logo_storage_path || '',
        // Add missing required fields with fallbacks
        company: agentData.company || parsedSettings.company || '',
        description: agentData.description || parsedSettings.description || '',
        deleted_at: agentData.deleted_at || parsedSettings.deleted_at || null,
        deletion_scheduled_at: agentData.deletion_scheduled_at || parsedSettings.deletion_scheduled_at || null,
        last_active: agentData.last_active || parsedSettings.last_active || null,
        widget_settings: parsedSettings || {},
        name: agentData.name || '',
        is_error: false,
        user_id: parsedSettings.user_id || undefined,
        openai_assistant_id: agentData.openai_assistant_id || undefined
      };
      
      // Extract widget settings
      const widgetSettings = extractWidgetSettings(agentData);
      
      return {
        ...client,
        widget_settings: widgetSettings
      };
    },
    ...queryOptions,
  });

  return { client, isLoading, error, refetch };
};
