
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings } from "@/types/widget-settings";
import { checkAndRefreshAuth } from "@/services/authService";

/**
 * Removes quotation marks and other potentially problematic characters from a string
 */
function sanitizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/["`']/g, '');
}

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
    
    // Sanitize strings to remove quotation marks and other potentially problematic characters
    const sanitizedAgentName = sanitizeString(settings.agent_name);
    const sanitizedClientName = sanitizeString(clientName);
    
    console.log("Syncing widget settings with AI agent:", { 
      clientId, 
      settings: { ...settings, agent_name: sanitizedAgentName },
      clientName: sanitizedClientName 
    });
    
    // First check if an AI agent exists for this client
    const { data: agentData, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, name, settings")
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
      agent_name: sanitizedAgentName,
      client_name: sanitizedClientName || "",
      updated_at: new Date().toISOString()
    };
    
    if (agentData?.id) {
      // Update existing AI agent
      const { error: updateError } = await supabase
        .from("ai_agents")
        .update({
          name: sanitizedAgentName, // Update name to match widget settings, ensuring no quotation marks
          settings: agentSettings
        })
        .eq("id", agentData.id);
      
      if (updateError) {
        console.error("Error updating AI agent with widget settings:", updateError);
        return false;
      }
      
      console.log("Successfully updated AI agent with widget settings");
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
