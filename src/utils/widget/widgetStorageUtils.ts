
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings } from "@/types/widget-settings";

/**
 * Helper function to get current widget settings to avoid overwriting other settings
 */
export async function getCurrentWidgetSettings(clientId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("widget_settings")
      .eq("id", clientId)
      .single();
      
    if (error) {
      console.error("Error fetching current widget settings:", error);
      return {};
    }
    
    return data?.widget_settings || {};
  } catch (error) {
    console.error("Error in getCurrentWidgetSettings:", error);
    return {};
  }
}

/**
 * Converts WidgetSettings object to a JSON structure for database storage
 */
export function convertSettingsToJson(settings: WidgetSettings): { [key: string]: any } {
  const { defaultSettings } = require("@/types/widget-settings");
  
  return {
    agent_name: settings.agent_name || defaultSettings.agent_name,
    logo_url: settings.logo_url || '',
    logo_storage_path: settings.logo_storage_path || '',
    chat_color: settings.chat_color || defaultSettings.chat_color,
    background_color: settings.background_color || defaultSettings.background_color,
    text_color: settings.text_color || defaultSettings.text_color,
    secondary_color: settings.secondary_color || defaultSettings.secondary_color,
    position: settings.position || defaultSettings.position,
    welcome_text: settings.welcome_text || defaultSettings.welcome_text,
    response_time_text: settings.response_time_text || defaultSettings.response_time_text
  };
}
