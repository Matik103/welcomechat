
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient, 
  logClientUpdateActivity,
  sendClientInvitation
} from "@/services/clientService";
import { toast } from "sonner";
import { createAiAgentTable } from "@/services/aiAgentTableService";

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        // Ensure consistent, sanitized agent names
        const sanitizedAgentName = data.agent_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();
        const updatedData = {
          ...data,
          agent_name: finalAgentName,
        };

        let clientId: string;
        
        if (id) {
          // For existing clients, update client data
          clientId = await updateClient(id, updatedData);
          await logClientUpdateActivity(id);
          
          // Ensure AI agent is initialized
          const agentResult = await createAiAgentTable(finalAgentName, clientId);
          console.log("Updated AI agent table result:", agentResult);
          
          return clientId;
        } else {
          // For new clients, create the client and then initialize AI agent
          const newClientId = await createClient(updatedData);
          console.log("New client created with ID:", newClientId);
          
          // Initialize AI agent in centralized table
          const agentResult = await createAiAgentTable(finalAgentName, newClientId);
          console.log("Created AI agent table result:", agentResult);
          
          return newClientId;
        }
      } catch (error: any) {
        console.error("Error in client mutation:", error);
        throw new Error(error.message || "Failed to save client");
      }
    },
    onSuccess: (clientId) => {
      if (id) {
        toast.success("Client updated successfully");
      } else {
        toast.success("Client created successfully");
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return clientMutation;
};
