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
      console.log(`Attempting to fetch client with ID: ${clientId}`);
      
      // First try to find any matching record in ai_agents
      const { data: anyMatch, error: matchError } = await supabase
        .from('ai_agents')
        .select('*')
        .or(`id.eq.${clientId},client_id.eq.${clientId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (matchError) {
        console.error('Error in initial client lookup:', matchError);
      } else {
        console.log('Initial client lookup result:', anyMatch);
      }

      // If we found a record but it doesn't have interaction_type = 'config',
      // let's update it
      if (anyMatch && anyMatch.interaction_type !== 'config') {
        console.log('Found client record but needs interaction_type update');
        
        // Create a config record if it doesn't exist
        const { data: configRecord, error: configError } = await supabase
          .from('ai_agents')
          .insert([{
            client_id: anyMatch.id,
            interaction_type: 'config',
            name: anyMatch.name || 'AI Assistant',
            client_name: anyMatch.client_name || '',
            email: anyMatch.email || '',
            agent_description: anyMatch.agent_description || '',
            settings: anyMatch.settings || {},
            status: anyMatch.status || 'active'
          }])
          .select()
          .single();
          
        if (configError) {
          console.error('Error creating config record:', configError);
        } else {
          console.log('Created new config record:', configRecord);
          return mapToClient(configRecord);
        }
      }

      // Try to get the client with interaction_type = 'config'
      const { data: configData, error: configError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config')
        .or(`id.eq.${clientId},client_id.eq.${clientId}`)
        .maybeSingle();
        
      if (configError) {
        console.error('Error fetching config client:', configError);
        throw configError;
      }

      if (!configData) {
        console.log('No config record found, using any matching record');
        return anyMatch ? mapToClient(anyMatch) : null;
      }

      return mapToClient(configData);
    } catch (error) {
      console.error('Error in fetchClient:', error);
      throw error;
    }
  };

  // Helper function to map database record to Client type
  const mapToClient = (data: any): Client => {
    const widgetSettings = safeParseSettings(data.settings);
    
    return {
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
