
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
        // Try to get a specific agent with this client ID
        const query = `
          SELECT * FROM ai_agents 
          WHERE client_id = '${clientId}' OR id = '${clientId}'
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const result = await execSql(query);
        
        if (!result || !Array.isArray(result) || result.length === 0) {
          console.log("No agent found for client ID:", clientId);
          return null;
        }
        
        const clientData = result[0] as Record<string, any>;
        
        if (!clientData) return null;
        
        console.log("Found agent data:", clientData);
        
        // Map data to Client type with proper type casting and null checks
        return {
          id: String(clientData.id || ''),
          client_name: String(clientData.client_name || ''),
          email: String(clientData.email || ''),
          logo_url: String(clientData.logo_url || ''),
          logo_storage_path: String(clientData.logo_storage_path || ''),
          created_at: String(clientData.created_at || ''),
          updated_at: String(clientData.updated_at || ''),
          deletion_scheduled_at: clientData.deletion_scheduled_at ? String(clientData.deletion_scheduled_at) : undefined,
          deleted_at: clientData.deleted_at ? String(clientData.deleted_at) : undefined,
          status: String(clientData.status || 'active'),
          agent_name: String(clientData.name || ''),
          description: String(clientData.agent_description || ''),
          name: String(clientData.name || ''),
          last_active: clientData.last_active ? String(clientData.last_active) : undefined,
          widget_settings: clientData.settings || {},
        };
      } catch (error) {
        console.error("Error fetching client:", error);
        return null;
      }
    },
    enabled: !!clientId,
  });

  return { client, isLoading, error, refetch };
};
