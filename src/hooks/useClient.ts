
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { safeParseSettings } from '@/utils/clientSettingsUtils';

export const useClient = (clientId: string, options = {}) => {
  const fetchClient = async (): Promise<Client | null> => {
    if (!clientId) {
      console.log("No clientId provided to useClient");
      return null;
    }

    try {
      console.log(`Fetching client with ID: ${clientId}`);
      
      // Try fetching by direct ID first from ai_agents table
      let { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', clientId)
        .eq('interaction_type', 'config')
        .maybeSingle();

      // If no results from direct ID, try client_id field
      if (!data && !error) {
        console.log(`No client found with ID: ${clientId}, trying client_id field`);
        const { data: altData, error: altError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .maybeSingle();
          
        data = altData;
        error = altError;
      }

      if (error) {
        console.error('Error fetching client:', error);
        throw error;
      }

      if (!data) {
        console.log(`No client found with ID or client_id: ${clientId}`);
        return null;
      }

      // Ensure widget_settings is an object, not a string
      const widgetSettings = safeParseSettings(data.settings);

      // Map the ai_agents fields to the Client type
      const client: Client = {
        id: data.id,
        client_id: data.client_id || data.id,
        client_name: data.client_name || '',
        email: data.email || '',
        status: data.status as 'active' | 'inactive' | 'deleted' || 'active',
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        agent_name: data.name || '',
        agent_description: data.agent_description || '',
        logo_url: data.logo_url || '',
        widget_settings: widgetSettings,
        user_id: '',
        company: data.company || '',
        description: data.description || '',
        logo_storage_path: data.logo_storage_path || '',
        deletion_scheduled_at: data.deletion_scheduled_at || null,
        deleted_at: data.deleted_at || null,
        last_active: data.last_active || null,
        name: data.name || '',
        is_error: data.is_error || false
      };

      console.log('Client data retrieved successfully:', client.id);
      return client;
    } catch (error) {
      console.error('Error in fetchClient:', error);
      throw error;
    }
  };

  const result = useQuery({
    queryKey: ['client', clientId],
    queryFn: fetchClient,
    enabled: Boolean(clientId),
    ...options,
  });
  
  return {
    ...result,
    client: result.data
  };
};
