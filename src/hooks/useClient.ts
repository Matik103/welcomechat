
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
        // Use execSql to get client data from ai_agents table
        const query = `
          SELECT * FROM ai_agents 
          WHERE id = '${clientId}'
          LIMIT 1
        `;
        
        const result = await execSql(query);
        
        if (!result || !Array.isArray(result) || result.length === 0) {
          return null;
        }
        
        const clientData = result[0];
        
        if (!clientData) return null;
        
        // Map data to Client type with proper type casting
        return {
          id: String(clientData.id || ''),
          client_name: String(clientData.client_name || ''),
          email: String(clientData.email || ''),
          logo_url: String(clientData.logo_url || ''),
          logo_storage_path: String(clientData.logo_storage_path || ''),
          created_at: String(clientData.created_at || ''),
          updated_at: String(clientData.updated_at || ''),
          deletion_scheduled_at: clientData.deletion_scheduled_at ? String(clientData.deletion_scheduled_at) : null,
          deleted_at: clientData.deleted_at ? String(clientData.deleted_at) : null,
          status: String(clientData.status || 'active'),
          company: String(clientData.company || ''),
          description: String(clientData.agent_description || ''),
          name: String(clientData.name || ''),
          agent_name: String(clientData.name || ''),
          last_active: clientData.last_active ? String(clientData.last_active) : null,
          widget_settings: clientData.settings || {},
          // Safely access nested properties
          settings: {
            primary_color: clientData.settings?.primary_color || '#3B82F6',
            background_color: clientData.settings?.background_color || '#FFFFFF',
            text_color: clientData.settings?.text_color || '#111827',
            secondary_color: clientData.settings?.secondary_color || '#E5E7EB',
            position: clientData.settings?.position || 'right',
            welcome_message: clientData.settings?.welcome_message || 'Hi there! How can I help you today?',
            response_time_text: clientData.settings?.response_time_text || 'Usually responds in a few minutes',
            agent_name: String(clientData.name || 'AI Assistant'),
            agent_description: String(clientData.agent_description || ''),
            logo_url: String(clientData.logo_url || ''),
          }
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
