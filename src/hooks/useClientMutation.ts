
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { updateClient } from "@/services/clientService";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const queryClient = useQueryClient();
  
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!id) {
        console.error("Client mutation called without ID");
        toast.error("Cannot update client: ID is missing");
        throw new Error("Client ID is required to update client information");
      }

      console.log("Starting client mutation for ID:", id);
      console.log("Data being sent:", data);
      
      try {
        // Sanitize the agent name
        const sanitizedAgentName = data.agent_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        
        const updatedData = {
          ...data,
          agent_name: sanitizedAgentName,
        };

        const result = await updateClient(id, updatedData);
        console.log("Update client result:", result);
        return id;
      } catch (error) {
        console.error("Error in client mutation:", error);
        throw error;
      }
    },
    onSuccess: (id) => {
      console.log("Client mutation succeeded for ID:", id);
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", id] });
      queryClient.invalidateQueries({ queryKey: ["driveLinks", id] });
      toast.success("Client information updated successfully");
    },
    onError: (error: Error) => {
      console.error("Client mutation failed:", error);
      toast.error(`Error updating client: ${error.message}`);
    },
  });

  return clientMutation;
};
