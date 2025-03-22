
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
        console.log("Fetching client data for ID:", clientId);
        
        // First try to get from ai_agents table
        const query = `
          SELECT * FROM ai_agents 
          WHERE id = $1 OR client_id = $1
          LIMIT 1
        `;
        
        const result = await execSql(query, [clientId]);
        
        if (!result || !Array.isArray(result) || result.length === 0) {
          console.log("No agent found for client ID:", clientId);
          // If not found in ai_agents, try clients table as fallback
          const clientQuery = `
            SELECT * FROM clients 
            WHERE id = $1
            LIMIT 1
          `;
          
          const clientResult = await execSql(clientQuery, [clientId]);
          
          if (!clientResult || !Array.isArray(clientResult) || clientResult.length === 0) {
            console.log("No client found for ID:", clientId);
            return null;
          }
          
          const clientData = clientResult[0] as Record<string, any>;
          console.log("Found client data:", clientData);
          
          return {
            id: String(clientData.id || ''),
            client_id: String(clientData.id || ''),
            client_name: String(clientData.client_name || ''),
            email: String(clientData.email || ''),
            logo_url: String(clientData.logo_url || ''),
            logo_storage_path: String(clientData.logo_storage_path || ''),
            created_at: String(clientData.created_at || ''),
            updated_at: String(clientData.updated_at || ''),
            deletion_scheduled_at: clientData.deletion_scheduled_at ? String(clientData.deletion_scheduled_at) : undefined,
            deleted_at: clientData.deleted_at ? String(clientData.deleted_at) : undefined,
            status: String(clientData.status || 'active'),
            agent_name: String(clientData.agent_name || ''),
            description: String(clientData.description || ''),
            name: String(clientData.agent_name || ''),
            last_active: clientData.last_active ? String(clientData.last_active) : undefined,
            widget_settings: clientData.widget_settings || {},
          };
        }
        
        const clientData = result[0] as Record<string, any>;
        
        if (!clientData) return null;
        
        console.log("Found agent data:", clientData);
        
        // Map data to Client type with proper type casting and null checks
        return {
          id: String(clientData.id || ''),
          client_id: String(clientData.client_id || clientData.id || ''),
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
          description: String(clientData.agent_description || clientData.description || ''),
          name: String(clientData.name || ''),
          last_active: clientData.last_active ? String(clientData.last_active) : undefined,
          widget_settings: clientData.settings || {},
        };
      } catch (error) {
        console.error("Error fetching client:", error);
        throw error;
      }
    },
    enabled: !!clientId,
  });

  return { client, isLoading, error, refetch };
};
