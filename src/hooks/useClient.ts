
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';

export const useClient = (clientId: string) => {
  const fetchClient = async (): Promise<Client | null> => {
    if (!clientId) {
      console.log("No client ID provided to useClient hook");
      return null;
    }

    try {
      console.log(`Fetching client with ID: ${clientId}`);
      
      // Get client data from ai_agents table
      const { data: clientsData, error: clientError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
        
      if (clientError) {
        console.error("Error fetching client:", clientError);
        throw clientError;
      }
      
      if (!clientsData || clientsData.length === 0) {
        console.log(`No client found with ID: ${clientId}`);
        return null;
      }
      
      // Use the first client record
      const client = clientsData[0];
      
      // Parse settings if available
      const settings = client.settings || {};
      const parsedSettings = typeof settings === 'object' ? settings : {};
      
      // Instead of directly accessing client.user_id, let's extract it from settings if available
      // or set a default empty string
      const userId = settings.user_id || '';
      
      return {
        id: client.id,
        client_id: client.client_id || '',
        client_name: client.client_name || '',
        email: client.email || '',
        company: client.company || '',
        description: client.description || '',
        status: client.status as 'active' | 'inactive' | 'deleted',
        created_at: client.created_at || '',
        updated_at: client.updated_at || '',
        deletion_scheduled_at: client.deletion_scheduled_at,
        deleted_at: client.deleted_at,
        last_active: client.last_active,
        logo_url: client.logo_url || '',
        logo_storage_path: client.logo_storage_path || '',
        agent_name: client.name || '',
        agent_description: client.agent_description || '',
        widget_settings: parsedSettings,
        name: client.name || '',
        is_error: client.is_error || false,
        user_id: userId // Using the extracted userId
      };
    } catch (error) {
      console.error("Error in fetchClient:", error);
      throw error;
    }
  };
  
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: fetchClient,
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
