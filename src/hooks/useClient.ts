
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Client } from '@/types/client';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';
import { useEffect } from 'react';

export const useClient = (clientId: string, options = {}) => {
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
        
        // First try with a direct query using client_id
        const { data: clientIdData, error: clientIdError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
            
        if (clientIdData) {
          console.log("Found client by client_id:", clientIdData);
          return mapAgentToClient(clientIdData);
        }
        
        // If not found by client_id, try with id
        const { data: idData, error: idError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', clientId)
          .eq('interaction_type', 'config')
          .maybeSingle();
        
        if (idData) {
          console.log("Found client by ID:", idData);
          return mapAgentToClient(idData);
        }
        
        // Try with SQL query as a last resort for format issues
        const sqlResult = await callRpcFunctionSafe<any[]>('exec_sql', {
          sql_query: `
            SELECT * FROM ai_agents
            WHERE (id::text = $1 OR client_id::text = $1)
            AND interaction_type = 'config'
            ORDER BY created_at DESC
            LIMIT 1
          `,
          query_params: [clientId]
        });
        
        if (sqlResult && Array.isArray(sqlResult) && sqlResult.length > 0) {
          console.log("Found client by SQL:", sqlResult[0]);
          return mapAgentToClient(sqlResult[0]);
        }
        
        console.log("No client found for ID:", clientId);
        return null;
      } catch (error) {
        console.error("Error fetching client:", error);
        return null;
      }
    },
    enabled: !!clientId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Add this to ensure refetching when window regains focus
    refetchOnMount: true, // Refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
    ...options
  });
  
  // Set up manual refetch on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && clientId) {
        console.log('Document became visible - refetching client data for:', clientId);
        refetch();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clientId, refetch]);

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
