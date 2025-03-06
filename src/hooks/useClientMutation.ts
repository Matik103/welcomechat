
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
        throw new Error("Client ID is required to update client information");
      }

      // Simple UUID validation to prevent obvious errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.error("Invalid client ID format:", id);
        throw new Error("Invalid client ID format. Please try again or contact support.");
      }

      console.log("Starting client mutation for ID:", id);
      console.log("Data being sent:", data);
      
      return await updateClient(id, data);
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
