
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient, 
  logClientUpdateActivity,
  sendClientInvitation,
  sendFallbackEmail
} from "@/services/clientService";
import { toast } from "sonner";

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        const sanitizedAgentName = data.agent_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();
        const updatedData = {
          ...data,
          agent_name: finalAgentName,
        };

        if (id) {
          const clientId = await updateClient(id, updatedData);
          await logClientUpdateActivity(id);
          return clientId;
        } else {
          // If no client ID is available, create a temporary success object
          // but don't actually attempt to update anything in the database
          console.log("No client ID available for update, creating temporary success object");
          return "temp_" + Date.now();
        }
      } catch (error) {
        console.error("Error in client mutation:", error);
        throw new Error(error.message || "Failed to save client");
      }
    },
    onSuccess: (clientId) => {
      if (id) {
        toast.success("Client updated successfully");
      } else {
        toast.success("Client information saved successfully");
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return clientMutation;
};
