
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/types/client';
import { execSql } from '@/utils/rpcUtils';
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
        // Get client data from ai_agents table where interaction_type = 'config'
        const query = `
          SELECT * FROM ai_agents 
          WHERE (client_id = '${clientId}' OR id = '${clientId}') 
          AND interaction_type = 'config'
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const result = await execSql(query);
        
        if (!result || !Array.isArray(result) || result.length === 0) {
          console.log("No agent found for client ID:", clientId);
          
          // Fallback: try fetching from any ai_agents record for this client
          const fallbackQuery = `
            SELECT * FROM ai_agents 
            WHERE client_id = '${clientId}' OR id = '${clientId}'
            ORDER BY created_at DESC 
            LIMIT 1
          `;
          
          const fallbackResult = await execSql(fallbackQuery);
          
          if (!fallbackResult || !Array.isArray(fallbackResult) || fallbackResult.length === 0) {
            return null;
          }
          
          const clientData = fallbackResult[0] as Record<string, any>;
          console.log("Found fallback agent data:", clientData);
          
          // Map data to Client type with proper type casting
          return mapAgentToClient(clientData);
        }
        
        const clientData = result[0] as Record<string, any>;
        
        if (!clientData) return null;
        
        console.log("Found primary agent data:", clientData);
        
        // Map data to Client type with proper type casting
        return mapAgentToClient(clientData);
      } catch (error) {
        console.error("Error fetching client:", error);
        return null;
      }
    },
    enabled: !!clientId,
  });

  // Helper function to map ai_agents data to Client type
  const mapAgentToClient = (agentData: Record<string, any>): Client => {
    return {
      id: String(agentData.id || ''),
      client_name: String(agentData.client_name || ''),
      email: String(agentData.email || ''),
      logo_url: String(agentData.logo_url || ''),
      logo_storage_path: String(agentData.logo_storage_path || ''),
      created_at: String(agentData.created_at || ''),
      updated_at: String(agentData.updated_at || ''),
      deletion_scheduled_at: agentData.deletion_scheduled_at ? String(agentData.deletion_scheduled_at) : undefined,
      deleted_at: agentData.deleted_at ? String(agentData.deleted_at) : undefined,
      status: String(agentData.status || 'active'),
      agent_name: String(agentData.name || ''),
      description: String(agentData.agent_description || ''),
      name: String(agentData.name || ''),
      last_active: agentData.last_active ? String(agentData.last_active) : undefined,
      widget_settings: {
        agent_name: agentData.name || '',
        agent_description: agentData.agent_description || '',
        logo_url: agentData.logo_url || '',
        logo_storage_path: agentData.logo_storage_path || ''
      },
    };
  };

  return { client, isLoading, error, refetch };
};
