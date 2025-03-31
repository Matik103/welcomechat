
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Client } from '@/types/client';
import { updateClient } from '@/services/clientService';

// Define a type that includes only the properties we need for mutation
export type ClientMutationData = {
  client_id: string;
  client_name: string;
  email: string;
  agent_name: string;
  agent_description?: string;
  logo_url?: string;
  logo_storage_path?: string;
};

export const useClientMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (client: ClientMutationData) => {
      try {
        console.log('Updating client with data:', client);
        
        // Use the updateClient service function that prioritizes ai_agents table
        return await updateClient(client.client_id, client);
      } catch (error) {
        console.error('Error updating client:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate cached client data
      queryClient.invalidateQueries({ queryKey: ['client', variables.client_id] });
      // Also invalidate widget settings to ensure bidirectional sync
      queryClient.invalidateQueries({ queryKey: ['widget-settings', variables.client_id] });
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
