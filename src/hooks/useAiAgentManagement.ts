
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

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
      // Create settings object
      const settings = {
        agent_name: agentName,
        agent_description: agentDescription || "",
        logo_url: logoUrl || "",
        logo_storage_path: logoStoragePath || "",
        client_name: clientName || ""
      };

      // Create a new agent (no longer checking for existing ones)
      console.log("Creating new AI agent for client_id:", clientId);
      
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

      // Log activity to console only
      if (!skipActivityLog) {
        console.log(`[Activity Log] AI agent created:`, {
          agent_id: newAgent.id,
          client_id: clientId,
          timestamp: new Date().toISOString()
        });
      }

      // Log client activity if skipActivityLog is false
      if (!skipActivityLog && newAgent) {
        await createClientActivity(
          clientId,
          clientName || agentName,
          ActivityType.AGENT_CREATED,
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
      console.error("Error creating AI agent:", error);
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
