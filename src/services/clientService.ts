
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client-form";
import { toast } from "sonner";
import { createClientActivity } from "./clientActivityService";

// Handles the process of creating a new AI agent
export const createAgent = async (data: ClientFormData): Promise<string> => {
  console.log("Creating AI agent with data:", { 
    client_name: data.client_name,
    email: data.email,
    widget_settings: data.widget_settings
  });
  
  try {
    // Ensure we have a widget_settings object
    const widgetSettings = data.widget_settings || {};
    
    // Insert data directly into ai_agents table
    const { data: agentData, error: agentError } = await supabase
      .from("ai_agents")
      .insert({
        client_name: data.client_name,
        email: data.email,
        name: widgetSettings.agent_name || "AI Assistant",
        agent_description: widgetSettings.agent_description,
        logo_url: widgetSettings.logo_url,
        settings: widgetSettings,
        content: "",
        interaction_type: "config",
        status: "active"
      })
      .select("id")
      .single();

    if (agentError) {
      console.error("Error creating AI agent:", agentError);
      throw agentError;
    }

    const agentId = agentData.id;
    console.log(`AI agent created with ID: ${agentId}`);

    // Log AI agent creation activity
    await createClientActivity(
      agentId,
      "ai_agent_created",
      `New AI agent created: ${data.client_name}`,
      { 
        email: data.email,
        agent_name: widgetSettings.agent_name,
        has_agent_description: !!widgetSettings.agent_description
      }
    );

    return agentId;
  } catch (error) {
    console.error("Error in createAgent function:", error);
    throw error;
  }
};

// Logs a client update activity
export const logClientUpdateActivity = async (clientId: string): Promise<void> => {
  try {
    await createClientActivity(
      clientId,
      "client_updated",
      "Agent information updated",
      { updated_at: new Date().toISOString() }
    );
  } catch (error) {
    console.error("Error logging agent update activity:", error);
    // Don't rethrow - we don't want to fail the update if logging fails
  }
};
