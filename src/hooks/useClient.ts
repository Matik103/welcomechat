
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/types/client';
import { execSql } from '@/utils/rpcUtils';

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
        
        // Direct query to ai_agents table
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', clientId)
          .eq('interaction_type', 'config')
          .single();
        
        if (error) {
          console.error("Error fetching from ai_agents by id:", error);
          
          // Try by client_id as fallback
          const { data: clientData, error: clientError } = await supabase
            .from('ai_agents')
            .select('*')
            .eq('client_id', clientId)
            .eq('interaction_type', 'config')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (clientError) {
            console.error("Error fetching from ai_agents by client_id:", clientError);
            
            // Try with SQL query as a last resort
            const sqlQuery = `
              SELECT * FROM ai_agents
              WHERE client_id = $1
              AND interaction_type = 'config'
              ORDER BY created_at DESC
              LIMIT 1
            `;
            
            const sqlResult = await execSql(sqlQuery, [clientId]);
            
            if (!sqlResult || !Array.isArray(sqlResult) || sqlResult.length === 0) {
              return null;
            }
            
            return mapAgentToClient(sqlResult[0]);
          }
          
          if (!clientData) return null;
          
          return mapAgentToClient(clientData);
        }
        
        if (!data) return null;
        
        return mapAgentToClient(data);
      } catch (error) {
        console.error("Error fetching client:", error);
        return null;
      }
    },
    enabled: !!clientId,
  });

  return { client, isLoading, error, refetch };
};

// Helper function to map ai_agents data to Client type
function mapAgentToClient(agentData: any): Client {
  console.log("Raw agent data:", agentData);
  
  // Get the best client name
  const clientName = 
    agentData.client_name || 
    (agentData.settings && agentData.settings.client_name) || 
    agentData.name || 
    '';
  
  return {
    id: String(agentData.id || ''),
    client_name: clientName,
    email: String(agentData.email || agentData.settings?.email || ''),
    logo_url: String(agentData.logo_url || agentData.settings?.logo_url || ''),
    logo_storage_path: String(agentData.logo_storage_path || agentData.settings?.logo_storage_path || ''),
    created_at: String(agentData.created_at || ''),
    updated_at: String(agentData.updated_at || ''),
    deletion_scheduled_at: agentData.deletion_scheduled_at ? String(agentData.deletion_scheduled_at) : undefined,
    deleted_at: agentData.deleted_at ? String(agentData.deleted_at) : undefined,
    status: String(agentData.status || 'active'),
    agent_name: String(agentData.name || ''),
    description: String(agentData.agent_description || ''),
    name: String(agentData.name || ''),
    last_active: agentData.last_active ? String(agentData.last_active) : undefined,
    widget_settings: agentData.settings || {},
  };
}
