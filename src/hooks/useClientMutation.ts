
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Client } from '@/types/client';

export const useClientMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (client: Omit<Client, 'id'>) => {
      try {
        console.log('Updating client with data:', client);
        
        // First check if the AI agent config record exists
        const { data: agentConfig, error: checkError } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('client_id', client.client_id)
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
              name: client.agent_name,
              agent_description: client.agent_description,
              logo_url: client.logo_url,
              logo_storage_path: client.logo_storage_path,
              client_name: client.client_name,
              email: client.email,
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
              client_id: client.client_id,
              name: client.agent_name,
              agent_description: client.agent_description,
              logo_url: client.logo_url,
              logo_storage_path: client.logo_storage_path,
              client_name: client.client_name,
              email: client.email,
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
            client_name: client.client_name,
            email: client.email,
            agent_name: client.agent_name,
            updated_at: new Date().toISOString(),
            widget_settings: {
              ...(client.widget_settings || {}),
              agent_name: client.agent_name,
              agent_description: client.agent_description,
              logo_url: client.logo_url,
              logo_storage_path: client.logo_storage_path
            }
          })
          .eq('id', client.client_id);
        
        if (clientError) {
          console.error('Error updating client:', clientError);
          // Don't throw here, just log since the primary data is in ai_agents
        }
        
        return client.client_id;
      } catch (error) {
        console.error('Error updating client:', error);
        throw error;
      }
    },
    onSuccess: (clientId) => {
      // Invalidate cached client data
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      // Also invalidate widget settings
      queryClient.invalidateQueries({ queryKey: ['widget-settings', clientId] });
      toast.success('Client information updated successfully');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error(`Error updating client: ${error instanceof Error ? error.message : String(error)}`);
      return Promise.reject(error);
    }
  });

  return mutation;
};
