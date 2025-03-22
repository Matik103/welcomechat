
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
        
        // Direct query to ai_agents table with proper error handling
        const { data: agentData, error: agentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', clientId)
          .limit(1)
          .single();
        
        if (agentError) {
          console.log("Error fetching from ai_agents, trying with client_id:", agentError);
          
          // Try with client_id instead of id
          const { data: clientAgentData, error: clientAgentError } = await supabase
            .from('ai_agents')
            .select('*')
            .eq('client_id', clientId)
            .limit(1)
            .single();
          
          if (clientAgentError) {
            console.log("Error fetching from ai_agents with client_id, trying clients table:", clientAgentError);
            
            // If still not found, try the clients table
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('*')
              .eq('id', clientId)
              .limit(1)
              .single();
            
            if (clientError) {
              console.error("Error fetching client from both tables:", clientError);
              return null;
            }
            
            if (!clientData) {
              console.log("No client found in clients table");
              return null;
            }
            
            // Map clients table data to Client type
            return {
              id: clientData.id || '',
              client_id: clientData.id || '',
              client_name: clientData.client_name || '',
              email: clientData.email || '',
              logo_url: clientData.logo_url || '',
              logo_storage_path: clientData.logo_storage_path || '',
              created_at: clientData.created_at || '',
              updated_at: clientData.updated_at || '',
              deletion_scheduled_at: clientData.deletion_scheduled_at || null,
              deleted_at: clientData.deleted_at || null,
              status: clientData.status || 'active',
              agent_name: clientData.agent_name || '',
              description: clientData.description || '',
              name: clientData.agent_name || '',
              last_active: clientData.last_active || null,
              widget_settings: clientData.widget_settings || {},
            };
          }
          
          // Use the data from ai_agents with client_id
          if (!clientAgentData) {
            return null;
          }
          
          return mapAgentDataToClient(clientAgentData);
        }
        
        if (!agentData) {
          console.log("No data found in ai_agents table");
          return null;
        }
        
        return mapAgentDataToClient(agentData);
      } catch (error) {
        console.error("Error fetching client:", error);
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
      id: data.id || '',
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
      description: data.agent_description || data.description || '',
      name: data.name || '',
      last_active: data.last_active || null,
      widget_settings: {
        agent_name: data.name || '',
        agent_description: data.agent_description || data.description || '',
        logo_url: data.logo_url || '',
        logo_storage_path: data.logo_storage_path || '',
        ...(typeof settings === 'object' ? settings : {})
      },
    };
  };

  return { client, isLoading, error, refetch };
};
