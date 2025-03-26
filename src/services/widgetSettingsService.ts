
import { JsonObject, toJson } from "@/types/supabase-extensions";
import { WidgetSettings, defaultSettings } from "@/types/widget-settings";
import { execSql } from "@/utils/rpcUtils";

/**
 * Updates widget settings for a client in the database
 */
export const updateWidgetSettings = async (clientId: string, settings: WidgetSettings): Promise<boolean> => {
  try {
    // Convert settings to a proper JSON string for safe handling
    const settingsJson = JSON.stringify(settings);
    
    // Update settings in ai_agents table
    const agentQuery = `
      UPDATE ai_agents
      SET 
        settings = $1::jsonb,
        name = $2,
        agent_description = $3,
        logo_url = $4,
        logo_storage_path = $5
      WHERE client_id = $6 AND interaction_type = 'config'
    `;
    
    await execSql(agentQuery, [
      settingsJson,
      settings.agent_name || '',
      settings.agent_description || '',
      settings.logo_url || '',
      settings.logo_storage_path || '',
      clientId
    ]);
    
    return true;
  } catch (error) {
    console.error("Error in updateWidgetSettings:", error);
    return false;
  }
};

/**
 * Converts widget settings to a JSON object for database storage
 */
export const widgetSettingsToJson = (settings: Partial<WidgetSettings>): JsonObject => {
  const jsonObj: Record<string, any> = {};
  
  // Explicitly handle each key to avoid type issues
  if (settings.theme_color) jsonObj.theme_color = settings.theme_color;
  if (settings.text_color) jsonObj.text_color = settings.text_color;
  if (settings.agent_name) jsonObj.agent_name = settings.agent_name;
  if (settings.font) jsonObj.font = settings.font;
  if (settings.agent_description) jsonObj.agent_description = settings.agent_description;
  if (settings.logo_url) jsonObj.logo_url = settings.logo_url;
  if (settings.button_position) jsonObj.button_position = settings.button_position;
  if (settings.button_text) jsonObj.button_text = settings.button_text;
  if (settings.logo_storage_path) jsonObj.logo_storage_path = settings.logo_storage_path;
  if (settings.welcome_message) jsonObj.welcome_message = settings.welcome_message;
  if (settings.initial_messages) jsonObj.initial_messages = settings.initial_messages;
  if (settings.placeholder_text) jsonObj.placeholder_text = settings.placeholder_text;
  if (settings.button_icon) jsonObj.button_icon = settings.button_icon;
  if (settings.chat_icon) jsonObj.chat_icon = settings.chat_icon;
  if (settings.show_sources) jsonObj.show_sources = settings.show_sources;
  if (settings.powered_by_text) jsonObj.powered_by_text = settings.powered_by_text;
  if (settings.reset_conversation) jsonObj.reset_conversation = settings.reset_conversation;
  if (settings.custom_css) jsonObj.custom_css = settings.custom_css;
  
  return jsonObj as JsonObject;
};

// Import supabase at the end to avoid circular dependencies
import { supabase } from "@/integrations/supabase/client";
