
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { useClientData } from "@/hooks/useClientData";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateAiPrompt } from "@/utils/activityTypeUtils";

interface ClientDetailsProps {
  client: Client | null;
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

// Define a consistent return type for ensureAiAgentExists
interface AgentUpdateResult {
  updated: boolean;
  created: boolean;
  descriptionUpdated: boolean;
}

export const ClientDetails = ({ 
  client, 
  clientId, 
  isClientView,
  logClientActivity 
}: ClientDetailsProps) => {
  const navigate = useNavigate();
  // Use the clientId that was passed to the component
  const { clientMutation, refetchClient } = useClientData(clientId);

  // Function to ensure AI agent exists with correct name and description
  const ensureAiAgentExists = async (clientId: string, agentName: string, agentDescription?: string): Promise<AgentUpdateResult> => {
    try {
      console.log(`Ensuring AI agent exists for client ${clientId} with name ${agentName}`);
      console.log(`Agent description: ${agentDescription}`);
      
      // Use the agent name exactly as provided without any modifications
      const formattedAgentName = agentName;
      
      // Generate AI prompt from agent name and description
      const aiPrompt = generateAiPrompt(agentName, agentDescription || "");
      
      // Check if agent exists
      const { data: existingAgents, error: queryError } = await supabase
        .from("ai_agents")
        .select("id, name, agent_description")
        .eq("client_id", clientId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (queryError) {
        console.error("Error checking for existing AI agent:", queryError);
        return { updated: false, created: false, descriptionUpdated: false };
      }

      const settings = {
        agent_description: agentDescription || "",
        client_id: clientId,
        updated_at: new Date().toISOString()
      };

      if (existingAgents && existingAgents.length > 0) {
        // Update existing agent
        const { error: updateError } = await supabase
          .from("ai_agents")
          .update({ 
            name: formattedAgentName,
            agent_description: agentDescription,
            ai_prompt: aiPrompt,
            settings: settings
          })
          .eq("id", existingAgents[0].id);
        
        if (updateError) {
          console.error("Error updating AI agent:", updateError);
          throw updateError;
        } else {
          console.log(`Updated agent name from ${existingAgents[0].name} to ${formattedAgentName}`);
          console.log(`Updated agent description to: ${agentDescription}`);
          console.log(`Generated AI prompt: ${aiPrompt}`);
          
          // Log if description was updated
          const descriptionChanged = existingAgents[0].agent_description !== agentDescription;
          if (descriptionChanged) {
            return { updated: true, created: false, descriptionUpdated: true };
          }
          
          return { updated: true, created: false, descriptionUpdated: false };
        }
      } else {
        // Create new agent
        const { error: insertError } = await supabase
          .from("ai_agents")
          .insert({
            client_id: clientId,
            name: formattedAgentName,
            agent_description: agentDescription,
            ai_prompt: aiPrompt,
            content: "",
            interaction_type: "config",
            settings: settings,
            is_error: false
          });
        
        if (insertError) {
          console.error("Error creating new AI agent:", insertError);
          throw insertError;
        } else {
          console.log(`Created new AI agent with name ${formattedAgentName}`);
          console.log(`Set agent description to: ${agentDescription}`);
          console.log(`Generated AI prompt: ${aiPrompt}`);
          return { updated: false, created: true, descriptionUpdated: false };
        }
      }
    } catch (error) {
      console.error("Error in ensureAiAgentExists:", error);
      throw error;
    }
  };

  const handleSubmit = async (data: { 
    client_name: string; 
    email: string; 
    agent_name?: string; 
    agent_description?: string 
  }) => {
    try {
      console.log("Submitting client data:", data);
      
      if (clientId && isClientView) {
        // Update existing client
        await clientMutation.mutateAsync({
          client_name: data.client_name,
          email: data.email,
          agent_name: data.agent_name,
          agent_description: data.agent_description
        });
        
        // Ensure AI agent exists with correct name and description
        let agentUpdateResult = { updated: false, created: false, descriptionUpdated: false };
        if (data.agent_name) {
          agentUpdateResult = await ensureAiAgentExists(clientId, data.agent_name, data.agent_description);
        }
        
        // Refetch client data to update the UI with the latest changes
        refetchClient();
        
        // Log client information update activity
        try {
          // Log different activities based on what was updated
          if (agentUpdateResult.created) {
            await logClientActivity(
              "ai_agent_created", 
              "created a new AI agent",
              { 
                agent_name: data.agent_name,
                agent_description: data.agent_description
              }
            );
          } else if (agentUpdateResult.descriptionUpdated) {
            await logClientActivity(
              "ai_agent_updated", 
              "updated their AI agent description",
              { 
                agent_name: data.agent_name,
                agent_description: data.agent_description
              }
            );
          } else {
            await logClientActivity(
              "client_updated", 
              "updated their client information",
              { 
                updated_fields: Object.keys(data).filter(key => 
                  client && data[key as keyof typeof data] !== client[key as keyof typeof client]
                )
              }
            );
          }
        } catch (logError) {
          console.error("Error logging activity:", logError);
          // Continue even if logging fails
        }
        
        toast.success("Client information saved successfully");
      } else if (clientId) {
        // Admin updating client
        await clientMutation.mutateAsync({
          client_name: data.client_name,
          email: data.email,
          agent_name: data.agent_name,
          agent_description: data.agent_description
        });
        
        // Ensure AI agent exists with correct name and description
        if (data.agent_name) {
          await ensureAiAgentExists(clientId, data.agent_name, data.agent_description);
        }
        
        toast.success("Client updated successfully");
        navigate("/admin/clients");
      } else {
        // Create new client - show loading toast
        const toastId = "client-creation";
        toast.loading("Creating client account...", { id: toastId });
        
        try {
          // Create the client and attempt to send invitation
          const result = await clientMutation.mutateAsync({
            client_name: data.client_name,
            email: data.email,
            agent_name: data.agent_name,
            agent_description: data.agent_description
          });
          
          // Check if result contains emailSent flag
          if (typeof result === 'object' && 'clientId' in result) {
            // Ensure AI agent exists with correct name for the new client
            if (data.agent_name && result.clientId) {
              await ensureAiAgentExists(result.clientId, data.agent_name, data.agent_description);
            }
            
            if (result.emailSent) {
              toast.dismiss(toastId);
              toast.success("Client created and invitation email sent successfully");
            } else {
              toast.dismiss(toastId);
              // Show a more detailed error message if we have one
              const errorDetail = result.errorMessage ? `: ${result.errorMessage}` : "";
              toast.warning(`Client created but failed to send invitation email${errorDetail}. Please try sending it manually later.`);
            }
            
            // Navigate back to client list regardless of email status
            navigate("/admin/clients");
          } else {
            // Handle legacy return format (just clientId)
            toast.dismiss(toastId);
            toast.success("Client created successfully");
            navigate("/admin/clients");
          }
        } catch (createError: any) {
          toast.dismiss(toastId);
          console.error("Error creating client:", createError);
          toast.error(`Failed to create client: ${createError.message}`);
        }
      }
    } catch (error: any) {
      console.error("Error submitting client form:", error);
      // Enhanced error message with more details if available
      const errorDetails = error?.code ? ` (${error.code}: ${error.message})` : "";
      toast.error("Failed to save client information" + (errorDetails || ": " + (error?.message || "Unknown error")));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isLoading={clientMutation.isPending}
        isClientView={isClientView}
      />
    </div>
  );
};
