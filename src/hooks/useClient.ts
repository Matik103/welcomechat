
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/types/client';
import { Json } from '@/integrations/supabase/types';
import { execSql } from "@/utils/rpcUtils";

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
        
        // Try to fetch from ai_agents table first
        const agentQuery = `
          SELECT * 
          FROM ai_agents 
          WHERE client_id = $1 AND interaction_type = 'config'
          LIMIT 1
        `;
        
        const agentResult = await execSql(agentQuery, [clientId]);
        
        if (agentResult && Array.isArray(agentResult) && agentResult.length > 0) {
          console.log("Found client in ai_agents table:", agentResult[0]);
          return mapAgentDataToClient(agentResult[0]);
        }
        
        // If not found in ai_agents, try clients table
        const clientQuery = `
          SELECT * 
          FROM clients 
          WHERE id = $1 
          LIMIT 1
        `;
        
        const clientResult = await execSql(clientQuery, [clientId]);
        
        if (clientResult && Array.isArray(clientResult) && clientResult.length > 0) {
          console.log("Found client in clients table:", clientResult[0]);
          
          const data = clientResult[0];
          
          // Map clients table data to Client type
          return {
            id: data.id || '',
            client_id: data.id || '',
            client_name: data.client_name || '',
            email: data.email || '',
            logo_url: data.logo_url || '',
            logo_storage_path: data.logo_storage_path || '',
            created_at: data.created_at || '',
            updated_at: data.updated_at || '',
            deletion_scheduled_at: data.deletion_scheduled_at || null,
            deleted_at: data.deleted_at || null,
            status: data.status || 'active',
            agent_name: data.agent_name || '',
            description: data.description || '',
            name: data.agent_name || '',
            last_active: data.last_active || null,
            widget_settings: data.widget_settings || {},
          };
        }
        
        console.log("No client found in either table for ID:", clientId);
        return null;
        
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
