import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Client } from '@/types/client';

interface ClientUpdateData extends Partial<Client> {
  client_id: string;
  client_name: string;
  email: string;
  agent_name: string;
}

interface MutationResponse {
  success: boolean;
}

export const useClientMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<MutationResponse, Error, ClientUpdateData>({
    mutationFn: async (clientData: ClientUpdateData) => {
      try {
        console.log('Updating client with data:', clientData);
        
        // Prepare a minimum set of fields needed for both tables
        const clientFields = {
          client_name: clientData.client_name,
          email: clientData.email,
          agent_name: clientData.agent_name,
          // Add empty values for required fields if not provided
          company: clientData.company || '',
          description: clientData.description || '',
          status: clientData.status || 'active',
          widget_settings: clientData.widget_settings || {},
        };
        
        // First check if the AI agent config record exists
        const { data: agentConfig, error: checkError } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('client_id', clientData.client_id)
          .eq('interaction_type', 'config')
          .maybeSingle();
          
        if (checkError) {
          console.error('Error checking if ai_agent exists:', checkError);
        }
        
        if (agentConfig) {
          // Update existing agent config
          console.log('Updating existing ai_agent config record');
          const { error: agentError } = await supabase
            .from('ai_agents')
            .update({
              name: clientData.agent_name,
              agent_description: clientData.agent_description || '',
              logo_url: clientData.logo_url || '',
              logo_storage_path: clientData.logo_storage_path || '',
              client_name: clientData.client_name,
              email: clientData.email,
              updated_at: new Date().toISOString()
            })
            .eq('id', agentConfig.id);
            
          if (agentError) {
            console.error('Error updating ai_agent:', agentError);
            throw agentError;
          }
        } else {
          // Create new agent config if it doesn't exist
          console.log('Creating new ai_agent config record');
          const { error: createError } = await supabase
            .from('ai_agents')
            .insert({
              client_id: clientData.client_id,
              name: clientData.agent_name,
              agent_description: clientData.agent_description || '',
              logo_url: clientData.logo_url || '',
              logo_storage_path: clientData.logo_storage_path || '',
              client_name: clientData.client_name,
              email: clientData.email,
              interaction_type: 'config',
              status: 'active'
            });
            
          if (createError) {
            console.error('Error creating ai_agent:', createError);
            throw createError;
          }
        }
        
        // Now update the client record for backward compatibility
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            client_name: clientData.client_name,
            email: clientData.email,
            agent_name: clientData.agent_name,
            company: clientFields.company,
            description: clientFields.description,
            status: clientFields.status,
            updated_at: new Date().toISOString(),
            widget_settings: {
              ...(clientData.widget_settings || {}),
              agent_name: clientData.agent_name,
              agent_description: clientData.agent_description || '',
              logo_url: clientData.logo_url || '',
              logo_storage_path: clientData.logo_storage_path || ''
            }
          })
          .eq('client_id', clientData.client_id);

        if (clientError) {
          console.error('Error updating client:', clientError);
          throw clientError;
        }

        return { success: true };
      } catch (error) {
        console.error('Error in client mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error in client mutation:', error);
      toast.error('Failed to update client');
    }
  });

  return mutation;
};
