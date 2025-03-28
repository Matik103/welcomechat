
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateClient } from '@/services/clientService';
import { ClientFormData } from '@/types/client-form';

interface MutationParams extends ClientFormData {
  client_id: string;
}

export const useClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MutationParams) => {
      try {
        // Prepare the update data
        const updateData = {
          client_name: params.client_name,
          email: params.email,
          agent_name: params.agent_name,
          agent_description: params.agent_description,
          logo_url: params.logo_url,
          logo_storage_path: params.logo_storage_path
        };
  
        // Update the client in the database
        const updated = await updateClient(params.client_id, updateData);
        return updated;
      } catch (error) {
        console.error('Error in updateClient mutation:', error);
        throw error; // Re-throw for the UI to handle
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate only the specific client query to prevent excessive refetching
      queryClient.invalidateQueries({ queryKey: ['client', variables.client_id] });
      toast.success('Client updated successfully');
    },
    onError: (error) => {
      console.error('Client update failed:', error);
      toast.error('Failed to update client');
    }
  });
};
