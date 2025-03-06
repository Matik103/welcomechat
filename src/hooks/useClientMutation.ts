
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { updateClient, createClient } from "@/services/clientService";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const queryClient = useQueryClient();
  
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      // For new clients (no ID), use createClient
      if (!id) {
        console.log("Creating new client");
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

          const newClientId = await createClient(updatedData);
          console.log("New client created with ID:", newClientId);
          return newClientId;
        } catch (error) {
          console.error("Error in client creation:", error);
          throw error;
        }
      }
      
      // For existing clients, use updateClient
      console.log("Updating client for ID:", id);
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
    onSuccess: (clientId) => {
      console.log("Client mutation succeeded for ID:", clientId);
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["websiteUrls", clientId] });
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
      
      const isNewClient = !id;
      const successMessage = isNewClient 
        ? "Client created successfully" 
        : "Client information updated successfully";
      
      toast.success(successMessage);
    },
    onError: (error: Error) => {
      console.error("Client mutation failed:", error);
      const isNewClient = !id;
      const errorMessage = isNewClient 
        ? `Error creating client: ${error.message}`
        : `Error updating client: ${error.message}`;
      
      toast.error(errorMessage);
    },
  });

  return clientMutation;
};
