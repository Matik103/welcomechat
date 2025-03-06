
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { updateClient } from "@/services/clientService";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const queryClient = useQueryClient();
  
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!id) {
        throw new Error("Client ID is required to update client information");
      }

      try {
        const sanitizedAgentName = data.agent_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        
        const updatedData = {
          ...data,
          agent_name: sanitizedAgentName,
        };

        await updateClient(id, updatedData);
        return id;
      } catch (error) {
        console.error("Error in client mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client"] });
      toast.success("Client information updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Error updating client: ${error.message}`);
    },
  });

  return clientMutation;
};
