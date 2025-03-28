
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientFormData } from '@/types/client-form';
import { Client } from '@/types/client';
import { updateClient } from '@/services/clientService';
import { toast } from 'sonner';

export interface ClientUpdateParams extends Partial<ClientFormData> {
  client_id: string;
}

export const useClientMutation = () => {
  return useMutation({
    mutationFn: async (params: ClientUpdateParams): Promise<Client> => {
      try {
        console.log("Updating client with params:", params);
        
        if (!params.client_id) {
          throw new Error("Client ID is required for update");
        }
        
        // Update the ai_agents table directly
        const { data, error } = await supabase
          .from('ai_agents')
          .update({
            name: params.agent_name,
            client_name: params.client_name,
            email: params.email,
            agent_description: params.agent_description,
            settings: {
              agent_name: params.agent_name,
              agent_description: params.agent_description,
              client_name: params.client_name,
              email: params.email
            }
          })
          .eq('client_id', params.client_id)
          .eq('interaction_type', 'config')
          .select('*')
          .single();
          
        if (error) {
          console.error("Error updating client:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("Failed to retrieve updated client data");
        }
        
        // Map the data to a Client object
        return {
          id: data.id,
          client_id: data.client_id || "",
          client_name: data.client_name || params.client_name || "",
          email: data.email || params.email || "",
          status: (data.status as 'active' | 'inactive' | 'deleted') || 'active',
          created_at: data.created_at || "",
          updated_at: data.updated_at || "",
          agent_name: data.name || params.agent_name || "",
          agent_description: data.agent_description || params.agent_description || "",
          logo_url: data.logo_url || "",
          widget_settings: data.settings || {},
          user_id: "",
          company: data.company || "",
          description: data.description || "",
          logo_storage_path: data.logo_storage_path || "",
          deletion_scheduled_at: data.deletion_scheduled_at || null,
          deleted_at: data.deleted_at || null,
          last_active: data.last_active || null,
          name: data.name || params.agent_name || "",
          is_error: data.is_error || false
        };
      } catch (error) {
        console.error("Error in client mutation:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to update client: ${errorMessage}`);
        throw error;
      }
    }
  });
};
