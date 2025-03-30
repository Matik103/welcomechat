
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { safeParseSettings } from '@/utils/clientSettingsUtils';
import { WebsiteUrl, DocumentLink } from '@/types/client';

export const useClient = (clientId: string, options = {}) => {
  const fetchClient = async (): Promise<Client | null> => {
    if (!clientId) {
      console.log("No clientId provided to useClient");
      return null;
    }

    try {
      console.log(`Fetching client with ID: ${clientId}`);
      
      // First try fetching by client_id field since that's what we use for client users
      let { data, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          website_urls (
            id,
            url,
            refresh_rate,
            status,
            created_at,
            updated_at
          ),
          document_links (
            id,
            link,
            document_type,
            refresh_rate,
            access_status,
            created_at
          )
        `)
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .maybeSingle();

      // If no results from client_id, try direct ID
      if (!data && !error) {
        console.log(`No client found with client_id: ${clientId}, trying direct ID`);
        const { data: altData, error: altError } = await supabase
          .from('ai_agents')
          .select(`
            *,
            website_urls (
              id,
              url,
              refresh_rate,
              status,
              created_at,
              updated_at
            ),
            document_links (
              id,
              link,
              document_type,
              refresh_rate,
              access_status,
              created_at
            )
          `)
          .eq('id', clientId)
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
        console.log(`No client found with client_id or ID: ${clientId}`);
        return null;
      }

      console.log('Raw client data from ai_agents:', data);

      // Ensure widget_settings is an object, not a string
      const widgetSettings = safeParseSettings(data.settings);

      // Map the ai_agents fields to the Client type
      const client: Client = {
        id: data.id,
        client_id: data.client_id || data.id,
        client_name: data.client_name || data.name || '',
        email: data.email || '',
        status: data.status as 'active' | 'inactive' | 'deleted' || 'active',
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        agent_name: data.name || '', // Using name as agent_name
        agent_description: data.agent_description || data.description || '',
        logo_url: data.logo_url || '',
        widget_settings: widgetSettings,
        user_id: data.id || '', // Using id as user_id
        company: data.company || '',
        description: data.description || data.agent_description || '',
        logo_storage_path: data.logo_storage_path || '',
        deletion_scheduled_at: data.deletion_scheduled_at || null,
        deleted_at: data.deleted_at || null,
        last_active: data.last_active || null,
        name: data.name || '', // Including name field for compatibility
        is_error: data.is_error || false,
        website_urls: (data.website_urls || []).map(url => ({
          ...url,
          client_id: clientId // Add the required client_id property
        })) as WebsiteUrl[],
        document_links: (data.document_links || []).map(link => ({
          ...link,
          client_id: clientId, // Add the required client_id property
          updated_at: link.created_at // Use created_at as fallback for updated_at
        })) as DocumentLink[]
      };

      console.log('Client data mapped successfully:', client);
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
