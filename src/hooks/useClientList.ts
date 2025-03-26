
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { safeParseSettings } from '@/utils/clientSettingsUtils';

export const useClientList = () => {
  const fetchClients = async (): Promise<Client[]> => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('interaction_type', 'config')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(agent => {
        const settings = safeParseSettings(agent.settings);
        
        return {
          id: agent.id,
          client_id: agent.client_id || agent.id,
          client_name: agent.client_name || agent.name || '',
          email: agent.email || '',
          company: agent.company || '',
          description: agent.description || '',
          status: agent.status || 'active',
          created_at: agent.created_at || '',
          updated_at: agent.updated_at || '',
          deleted_at: agent.deleted_at || null,
          deletion_scheduled_at: agent.deletion_scheduled_at || null,
          last_active: agent.last_active || null,
          logo_url: settings.logo_url || '',
          logo_storage_path: settings.logo_storage_path || '',
          agent_name: settings.agent_name || agent.name || '',
          agent_description: settings.agent_description || agent.agent_description || '',
          widget_settings: settings,
          name: agent.name || '',
          user_id: agent.user_id || '',
          is_error: false
        };
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  };

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  return {
    clients: data,
    isLoading,
    error,
    refetch,
  };
};
