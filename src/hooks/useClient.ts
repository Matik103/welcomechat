
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/types/client';
import { Json } from '@/integrations/supabase/types';

export const useClient = (clientId: string) => {
  const { 
    data: client, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async (): Promise<Client | null> => {
      if (!clientId) return null;
      
      try {
        console.log("Fetching client data for ID:", clientId);
        
        // First try to fetch from ai_agents table with client_id
        const { data: agentData, error: agentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .limit(1)
          .single();
        
        if (!agentError && agentData) {
          console.log("Found data in ai_agents table with client_id:", agentData);
          console.log("Logo URL from ai_agents:", agentData.logo_url);
          
          return mapAgentDataToClient(agentData);
        }
        
        // If not found by client_id, try using the id directly
        const { data: directAgentData, error: directAgentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', clientId)
          .limit(1)
          .single();
          
        if (!directAgentError && directAgentData) {
          console.log("Found data in ai_agents table with direct id:", directAgentData);
          console.log("Logo URL from ai_agents (direct id):", directAgentData.logo_url);
          
          return mapAgentDataToClient(directAgentData);
        }
        
        console.log("No client found in the ai_agents table. Client may not exist or has been deleted.");
        return null;
      } catch (error) {
        console.error("Error in useClient hook:", error);
        throw error;
      }
    },
    enabled: !!clientId,
    retry: 1,
    retryDelay: 1000,
  });

  // Helper function to map agent data to Client type
  const mapAgentDataToClient = (data: any): Client => {
    // Extract data from settings or use direct fields
    const settings = data.settings || {};
    
    return {
      id: data.client_id || data.id || '',
      client_id: data.client_id || data.id || '',
      client_name: data.client_name || settings.client_name || '',
      email: data.email || settings.email || '',
      logo_url: data.logo_url || settings.logo_url || '',
      logo_storage_path: data.logo_storage_path || settings.logo_storage_path || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      deletion_scheduled_at: data.deletion_scheduled_at || null,
      deleted_at: data.deleted_at || null,
      status: data.status || 'active',
      agent_name: data.name || '',
      agent_description: data.agent_description || '',
      description: data.description || data.agent_description || '',
      name: data.name || '',
      last_active: data.last_active || null,
      widget_settings: {
        agent_name: data.name || '',
        agent_description: data.agent_description || '',
        logo_url: data.logo_url || '',
        logo_storage_path: data.logo_storage_path || '',
        ...(typeof settings === 'object' ? settings : {})
      },
    };
  };

  return { client, isLoading, error, refetch };
};
