
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { createClient } from "@/services/clientService";
import { toast } from "sonner";

export const useNewClientMutation = () => {
  return useMutation({
    mutationFn: async (formData: ClientFormData) => {
      try {
        // Create the client
        const clientId = await createClient(formData);
        
        if (!clientId) {
          throw new Error('Failed to create client');
        }
        
        toast.success("Client created successfully!");
        return clientId;
      } catch (error: any) {
        console.error('Error in client creation mutation:', error);
        toast.error(`Failed to create client: ${error.message || 'Unknown error'}`);
        throw error;
      }
    }
  });
};
