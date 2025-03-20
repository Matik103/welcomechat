
import { supabase } from "@/integrations/supabase/client";

interface AgentUpdateResult {
  updated: boolean;
  created: boolean;
  descriptionUpdated: boolean;
  nameUpdated: boolean;
}

export const useAiAgentManagement = () => {
  const ensureAiAgentExists = async (
    clientId: string, 
    agentName?: string,
    agentDescription?: string,
    logoUrl?: string,
    logoStoragePath?: string,
    clientName?: string
  ): Promise<AgentUpdateResult> => {
    try {
      console.log(`Ensuring AI agent exists for client ${clientId}`);
      console.log(`Agent name: ${agentName}`);
      console.log(`Agent description: ${agentDescription}`);
      console.log(`Client name: ${clientName}`);
      console.log(`Agent logo URL: ${logoUrl}`);
      
      // Use a default agent name if not provided
      const finalAgentName = agentName || 'AI';
      
      // Check if AI agent exists for this client
      const { data: existingAgents, error: queryError } = await supabase
        .from("ai_agents")
        .select("id, name, agent_description")
        .eq("client_id", clientId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (queryError) {
        console.error("Error checking for existing AI agent:", queryError);
        return { updated: false, created: false, descriptionUpdated: false, nameUpdated: false };
      }

      const settings = {
        agent_name: finalAgentName,
        agent_description: agentDescription || "",
        client_id: clientId,
        client_name: clientName || "",
        logo_url: logoUrl || "",
        logo_storage_path: logoStoragePath || "",
        updated_at: new Date().toISOString()
      };

      if (existingAgents && existingAgents.length > 0) {
        const existingAgent = existingAgents[0];
        const nameChanged = existingAgent.name !== finalAgentName;
        const descriptionChanged = existingAgent.agent_description !== agentDescription;
        
        const { error: updateError } = await supabase
          .from("ai_agents")
          .update({ 
            name: finalAgentName,
            agent_description: agentDescription || "",
            content: "",
            interaction_type: "config",
            settings: settings,
            logo_url: logoUrl || "",
            logo_storage_path: logoStoragePath || "",
            updated_at: new Date().toISOString()
          })
          .eq("id", existingAgent.id);
        
        if (updateError) {
          console.error("Error updating AI agent:", updateError);
          throw updateError;
        } else {
          console.log(`Updated agent name to: ${finalAgentName}`);
          console.log(`Updated agent description to: ${agentDescription}`);
          console.log(`Updated agent logo URL to: ${logoUrl}`);
          
          return { 
            updated: true, 
            created: false, 
            descriptionUpdated: descriptionChanged,
            nameUpdated: nameChanged
          };
        }
      } else {
        const { error: insertError } = await supabase
          .from("ai_agents")
          .insert({
            client_id: clientId,
            name: finalAgentName,
            agent_description: agentDescription || "",
            content: "",
            interaction_type: "config",
            settings: settings,
            logo_url: logoUrl || "",
            logo_storage_path: logoStoragePath || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("Error creating new AI agent:", insertError);
          throw insertError;
        } else {
          console.log(`Created new AI agent with name: ${finalAgentName}`);
          console.log(`Set agent description to: ${agentDescription}`);
          console.log(`Set agent logo URL to: ${logoUrl}`);
          return { 
            updated: false, 
            created: true, 
            descriptionUpdated: true,
            nameUpdated: true
          };
        }
      }
    } catch (error) {
      console.error("Error in ensureAiAgentExists:", error);
      throw error;
    }
  };

  return { ensureAiAgentExists };
};
