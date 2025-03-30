
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
        console.log('Updating client with params:', params);
        
        if (!params.client_id) {
          console.error('No client_id provided to mutation');
          throw new Error('Client ID is required to update client');
        }
        
        // Prepare the update data
        const updateData = {
          client_name: params.client_name,
          email: params.email,
          agent_name: params.agent_name,
          agent_description: params.agent_description,
          logo_url: params.logo_url,
          logo_storage_path: params.logo_storage_path
        };
  
        // Update the client in the database using the ID
        const updated = await updateClient(params.client_id, updateData);
        return updated;
      } catch (error) {
        console.error('Error in updateClient mutation:', error);
        throw error; // Re-throw for the UI to handle
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['client', variables.client_id] });
      toast.success('Client updated successfully');
    },
    onError: (error) => {
      console.error('Client update failed:', error);
      // Provide more user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error 
          ? String((error as { message: unknown }).message) 
          : 'Failed to update client';
      toast.error(errorMessage);
    }
  });
};
