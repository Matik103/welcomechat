
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings } from "@/types/widget-settings";
import { checkAndRefreshAuth } from "@/services/authService";
import { generateAiPrompt } from "./activityTypeUtils";

/**
 * Syncs the widget settings with the AI agent data in the database
 */
export async function syncWidgetSettingsWithAgent(
  clientId: string,
  settings: WidgetSettings,
  clientName?: string
): Promise<boolean> {
  try {
    // Ensure we have a valid auth session
    await checkAndRefreshAuth();
    
    console.log("Syncing widget settings with AI agent:", { clientId, settings, clientName });
    
    // First check if an AI agent exists for this client
    const { data: agentData, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, name, settings, agent_description, logo_url, logo_storage_path")
      .eq("client_id", clientId)
      .maybeSingle();
    
    if (agentError) {
      console.error("Error checking for existing AI agent:", agentError);
      return false;
    }
    
    // Fix: Create a typed settings object with all necessary properties
    const agentSettings = {
      // Only copy specific properties from existing settings if they exist
      ...(agentData?.settings ? agentData.settings as Record<string, any> : {}),
      agent_name: settings.agent_name,
      agent_description: settings.agent_description || "",
      logo_url: settings.logo_url,
      logo_storage_path: settings.logo_storage_path,
      updated_at: new Date().toISOString()
    };
    
    if (agentData?.id) {
      // Generate an updated AI prompt with agent_name and clientName
      const aiPrompt = generateAiPrompt(
        settings.agent_name, // Use the agent_name from settings
        settings.agent_description || "", 
        clientName
      );
      
      // Update existing AI agent with all properties
      const { error: updateError } = await supabase
        .from("ai_agents")
        .update({
          name: settings.agent_name, // Update the agent name
          agent_description: settings.agent_description || "",
          logo_url: settings.logo_url,
          logo_storage_path: settings.logo_storage_path,
          settings: agentSettings,
          ai_prompt: aiPrompt
        })
        .eq("id", agentData.id);
      
      if (updateError) {
        console.error("Error updating AI agent with widget settings:", updateError);
        return false;
      }
      
      console.log("Successfully updated AI agent with widget settings and new prompt");
      return true;
    } else {
      // Create a new AI agent with all properties
      const { error: createError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: settings.agent_name,
          agent_description: settings.agent_description || "",
          logo_url: settings.logo_url,
          logo_storage_path: settings.logo_storage_path,
          content: "",
          settings: agentSettings,
          interaction_type: "config"
        });
        
      if (createError) {
        console.error("Error creating new AI agent:", createError);
        return false;
      }
      
      console.log("Successfully created new AI agent with widget settings");
      return true;
    }
  } catch (error) {
    console.error("Error in syncWidgetSettingsWithAgent:", error);
    return false;
  }
}
