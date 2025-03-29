import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClientActivity } from '@/services/clientActivityService';

export const useAiAgentManagement = () => {
  const [isCreating, setIsCreating] = useState(false);

  const ensureAiAgentExists = async (
    clientId: string,
    agentName: string = "AI Assistant",
    agentDescription?: string,
    logoUrl?: string,
    logoStoragePath?: string,
    clientName?: string,
    skipActivityLog: boolean = false
  ) => {
    if (!clientId) {
      return { success: false, error: "Client ID is required" };
    }

    setIsCreating(true);
    try {
      // Check if an AI agent for this client already exists
      const { data: existingAgent, error: checkError } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("client_id", clientId)
        .eq("interaction_type", "config")
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for existing agent:", checkError);
      }

      // If agent exists, update it
      if (existingAgent) {
        console.log("AI agent found, updating:", existingAgent.id);
        
        // Create settings object with all the values
        const existingSettings = existingAgent.settings || {};
        const settings = {
          ...(typeof existingSettings === 'object' ? existingSettings : {}),
          agent_name: agentName,
          agent_description: agentDescription || "",
          logo_url: logoUrl || "",
          logo_storage_path: logoStoragePath || "",
          client_name: clientName || existingAgent.client_name || ""
        };

        // Update the existing agent
        const { data: updatedAgent, error: updateError } = await supabase
          .from("ai_agents")
          .update({
            name: agentName,
            agent_description: agentDescription || "",
            logo_url: logoUrl || existingAgent.logo_url,
            logo_storage_path: logoStoragePath || existingAgent.logo_storage_path,
            client_name: clientName || existingAgent.client_name,
            settings,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingAgent.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        // Log the activity to console only
        if (!skipActivityLog) {
          console.log(`[Activity Log] AI agent updated:`, {
            agent_id: existingAgent.id,
            client_id: clientId,
            timestamp: new Date().toISOString()
          });
        }

        return { success: true, agent: updatedAgent, error: null };
      }

      // If agent doesn't exist, create new one
      console.log("No AI agent found, creating new one");
      
      // Create a settings object with all the values
      const settings = {
        agent_name: agentName,
        agent_description: agentDescription || "",
        logo_url: logoUrl || "",
        logo_storage_path: logoStoragePath || "",
        client_name: clientName || ""
      };

      // Create the new agent
      const { data: newAgent, error: createError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: agentName,
          agent_description: agentDescription || "",
          logo_url: logoUrl || "",
          logo_storage_path: logoStoragePath || "",
          client_name: clientName || "",
          interaction_type: "config",
          settings,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Log the activity to console only
      if (!skipActivityLog) {
        console.log(`[Activity Log] AI agent created:`, {
          agent_id: newAgent.id,
          client_id: clientId,
          timestamp: new Date().toISOString()
        });
      }

      // Log activity if skipActivityLog is false
      if (!skipActivityLog && newAgent) {
        await createClientActivity(
          clientId,
          clientName || agentName,
          'agent_created',
          `Created AI agent "${agentName}" for client ${clientName || 'Unknown'}`,
          {
            agent_name: agentName,
            agent_description: agentDescription || '',
            client_name: clientName
          }
        );
      }
      
      return { success: true, agent: newAgent, error: null };
    } catch (error) {
      console.error("Error ensuring AI agent exists:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    ensureAiAgentExists,
    isCreating
  };
};
