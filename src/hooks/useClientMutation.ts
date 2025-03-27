
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClient } from "@/services/clientService";
import { toast } from "sonner";
import { Client } from "@/types/client";

export type ClientMutationData = {
  client_id?: string;
  client_name: string;
  email: string;
  agent_name?: string;
  agent_description?: string;
};

export const useClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientMutationData) => {
      if (!data.client_id) {
        throw new Error("Cannot update client: Missing client ID");
      }

      const updateData: Partial<Client> = {
        client_name: data.client_name,
        email: data.email,
        updated_at: new Date().toISOString()
      };

      // Extract agent info directly from the form data
      if (data.agent_name) {
        updateData.name = data.agent_name;
        updateData.agent_name = data.agent_name;
      }
      
      if (data.agent_description) {
        updateData.agent_description = data.agent_description;
      }

      const updatedClient = await updateClient(data.client_id, updateData);
      return updatedClient.id;
    },
    onSuccess: (_, variables) => {
      toast.success("Client updated successfully");
      
      // Invalidate relevant queries
      if (variables.client_id) {
        queryClient.invalidateQueries({ queryKey: ['client', variables.client_id] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
    },
    onError: (error) => {
      console.error("Error updating client:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update client");
    }
  });
};
