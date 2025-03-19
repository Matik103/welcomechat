
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
      .select("id, name, settings, agent_description")
      .eq("client_id", clientId)
      .maybeSingle();
    
    if (agentError) {
      console.error("Error checking for existing AI agent:", agentError);
      return false;
    }
    
    // Fix: Create a typed settings object instead of using spread
    const agentSettings = {
      // Only copy specific properties from existing settings if they exist
      ...(agentData?.settings ? agentData.settings as Record<string, any> : {}),
      logo_url: settings.logo_url,
      agent_name: settings.agent_name,
      updated_at: new Date().toISOString()
    };
    
    if (agentData?.id) {
      // Generate an updated AI prompt with clientName
      const aiPrompt = generateAiPrompt(
        settings.agent_name || agentData.name, 
        agentData.agent_description || "", 
        clientName
      );
      
      // Update existing AI agent
      const { error: updateError } = await supabase
        .from("ai_agents")
        .update({
          name: settings.agent_name, // Update name to match widget settings
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
      console.log("No AI agent found for this client. Widget settings will be updated without agent sync.");
      return false;
    }
  } catch (error) {
    console.error("Error in syncWidgetSettingsWithAgent:", error);
    return false;
  }
}
