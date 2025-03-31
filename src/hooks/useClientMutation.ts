
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
        
        // Update the client data
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            client_name: client.client_name,
            email: client.email,
            agent_name: client.agent_name,
            updated_at: new Date().toISOString(),
            // We don't update widget_settings here to avoid overwriting existing settings
          })
          .eq('id', client.client_id);
        
        if (clientError) throw clientError;

        // Synchronize with ai_agents for widget settings
        const { data: agentConfig, error: checkError } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('client_id', client.client_id)
          .eq('interaction_type', 'config')
          .maybeSingle();
          
        if (checkError) throw checkError;
        
        if (agentConfig) {
          // Update existing agent config
          const { error: agentError } = await supabase
            .from('ai_agents')
            .update({
              name: client.agent_name,
              agent_description: client.agent_description,
              logo_url: client.logo_url,
              logo_storage_path: client.logo_storage_path,
              updated_at: new Date().toISOString()
            })
            .eq('client_id', client.client_id)
            .eq('interaction_type', 'config');
            
          if (agentError) throw agentError;
        } else {
          // Create new agent config if it doesn't exist
          const { error: createError } = await supabase
            .from('ai_agents')
            .insert({
              client_id: client.client_id,
              name: client.agent_name,
              agent_description: client.agent_description,
              logo_url: client.logo_url,
              logo_storage_path: client.logo_storage_path,
              interaction_type: 'config',
              status: 'active'
            });
            
          if (createError) throw createError;
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
