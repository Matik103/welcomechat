
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/types/client';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

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
        
        // Query ai_agents table with config interaction_type for client configuration
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          console.error("Error fetching from ai_agents by client_id:", error);
          return null;
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
  
  // Get the status and ensure it conforms to the Client status type
  const status = agentData.status || 'active';
  const validStatus: 'active' | 'inactive' | 'deleted' = 
    (status === 'active' || status === 'inactive' || status === 'deleted') 
      ? status as 'active' | 'inactive' | 'deleted'
      : 'active';
  
  return {
    id: String(agentData.id || ''),
    client_id: String(agentData.client_id || ''),
    user_id: String(agentData.user_id || ''),
    client_name: clientName,
    company: String(agentData.company || ''),
    description: agentData.description || '',
    email: String(agentData.email || (agentData.settings?.email) || ''),
    logo_url: String(agentData.logo_url || (agentData.settings?.logo_url) || ''),
    logo_storage_path: String(agentData.logo_storage_path || (agentData.settings?.logo_storage_path) || ''),
    created_at: String(agentData.created_at || ''),
    updated_at: String(agentData.updated_at || ''),
    deletion_scheduled_at: agentData.deletion_scheduled_at || null,
    deleted_at: agentData.deleted_at || null,
    status: validStatus,
    agent_name: String(agentData.name || ''),
    agent_description: String(agentData.agent_description || ''),
    last_active: agentData.last_active ? String(agentData.last_active) : null,
    widget_settings: agentData.settings || {},
    name: String(agentData.name || ''),
    is_error: agentData.is_error || false
  };
}
