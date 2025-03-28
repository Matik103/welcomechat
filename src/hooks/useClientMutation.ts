
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
      if (!params.client_id) {
        throw new Error("Client ID is required");
      }
      
      try {
        console.log("Updating client with ID:", params.client_id);
        console.log("Update data:", JSON.stringify(params));
        
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
        return updated.id;
      } catch (error) {
        console.error('Error in updateClient mutation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Client update failed: ${errorMessage}`);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['client', variables.client_id] });
      toast.success("Client information updated successfully");
    },
    onError: (error) => {
      console.error('Client update failed:', error);
      toast.error(`Failed to update client information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
};
