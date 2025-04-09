import { JsonObject } from "@/types/supabase-extensions";
import { WidgetSettings, defaultSettings } from "@/types/widget-settings";
import { execSql } from "@/utils/rpcUtils";
import { safeParseSettings } from './clientSettingsUtils';

/**
 * Extracts and normalizes widget settings from client data
 */
export function extractWidgetSettings(agentData: any): WidgetSettings {
  const parsedSettings = safeParseSettings(agentData.settings);
  
  return {
    ...defaultSettings,
    agent_name: agentData.name || defaultSettings.agent_name,
    agent_description: agentData.agent_description || defaultSettings.agent_description,
    logo_url: agentData.logo_url || defaultSettings.logo_url,
    logo_storage_path: agentData.logo_storage_path || defaultSettings.logo_storage_path,
    chat_color: parsedSettings.chat_color || defaultSettings.chat_color,
    background_color: parsedSettings.background_color || defaultSettings.background_color,
    button_color: parsedSettings.button_color || defaultSettings.button_color,
    font_color: parsedSettings.font_color || defaultSettings.font_color,
    chat_font_color: parsedSettings.chat_font_color || defaultSettings.chat_font_color,
    background_opacity: parsedSettings.background_opacity || defaultSettings.background_opacity,
    button_text: parsedSettings.button_text || defaultSettings.button_text,
    position: parsedSettings.position || defaultSettings.position,
    greeting_message: parsedSettings.greeting_message || defaultSettings.greeting_message,
    text_color: parsedSettings.text_color || defaultSettings.text_color,
    secondary_color: parsedSettings.secondary_color || defaultSettings.secondary_color,
    welcome_text: parsedSettings.welcome_text || defaultSettings.welcome_text,
    response_time_text: parsedSettings.response_time_text || defaultSettings.response_time_text,
    display_mode: parsedSettings.display_mode || defaultSettings.display_mode,
    openai_assistant_id: agentData.openai_assistant_id,
    deepseek_assistant_id: agentData.deepseek_assistant_id,
    clientId: agentData.client_id
  };
}

/**
 * Normalizes widget settings to ensure all required properties are present
 */
export const normalizeWidgetSettings = (settings: Partial<WidgetSettings>): WidgetSettings => {
  return {
    ...defaultSettings,
    ...settings
  };
};

/**
 * Retrieves widget settings for a client from the database
 */
export const getWidgetSettings = async (clientId: string): Promise<WidgetSettings> => {
  try {
    // Query settings from ai_agents table
    const agentQuery = `
      SELECT settings, name, logo_url, logo_storage_path, agent_description
      FROM ai_agents
      WHERE client_id = $1 AND interaction_type = 'config'
      LIMIT 1
    `;
    
    const agentResult = await execSql(agentQuery, [clientId]);
    
    if (agentResult && Array.isArray(agentResult) && agentResult.length > 0) {
      return extractWidgetSettings(agentResult[0]);
    }
    
    // If no ai_agent record, try to get from clients table
    const clientQuery = `
      SELECT client_name, agent_name, widget_settings, logo_url, logo_storage_path
      FROM clients
      WHERE id = $1
      LIMIT 1
    `;
    
    const clientResult = await execSql(clientQuery, [clientId]);
    
    if (clientResult && Array.isArray(clientResult) && clientResult.length > 0) {
      return extractWidgetSettings(clientResult[0]);
    }
    
    return defaultSettings;
  } catch (error) {
    console.error("Error in getWidgetSettings:", error);
    return defaultSettings;
  }
};

/**
 * Updates widget settings for a client in the database
 */
export const updateWidgetSettings = async (clientId: string, settings: WidgetSettings): Promise<boolean> => {
  try {
    // First check if a record exists
    const checkQuery = `
      SELECT id FROM ai_agents
      WHERE client_id = $1 AND interaction_type = 'config'
      LIMIT 1
    `;
    
    const existingRecord = await execSql(checkQuery, [clientId]);
    
    if (existingRecord && Array.isArray(existingRecord) && existingRecord.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE ai_agents
        SET 
          settings = $1,
          name = $2,
          agent_description = $3,
          logo_url = $4,
          logo_storage_path = $5,
          updated_at = NOW()
        WHERE client_id = $6 AND interaction_type = 'config'
      `;
      
      await execSql(updateQuery, [
        JSON.stringify(settings),
        settings.agent_name,
        settings.agent_description,
        settings.logo_url,
        settings.logo_storage_path,
        clientId
      ]);
      
      // Also update clients table for bidirectional sync
      const updateClientQuery = `
        UPDATE clients
        SET
          agent_name = $1,
          logo_url = $2,
          logo_storage_path = $3,
          widget_settings = $4
        WHERE id = $5
      `;
      
      await execSql(updateClientQuery, [
        settings.agent_name,
        settings.logo_url,
        settings.logo_storage_path,
        JSON.stringify(settings),
        clientId
      ]);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO ai_agents (
          client_id,
          name,
          agent_description,
          logo_url,
          logo_storage_path,
          settings,
          interaction_type,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'config', NOW(), NOW()
        )
      `;
      
      await execSql(insertQuery, [
        clientId,
        settings.agent_name,
        settings.agent_description,
        settings.logo_url,
        settings.logo_storage_path,
        JSON.stringify(settings)
      ]);
      
      // Update clients table as well
      const updateClientQuery = `
        UPDATE clients
        SET
          agent_name = $1,
          logo_url = $2,
          logo_storage_path = $3,
          widget_settings = $4
        WHERE id = $5
      `;
      
      await execSql(updateClientQuery, [
        settings.agent_name,
        settings.logo_url,
        settings.logo_storage_path,
        JSON.stringify(settings),
        clientId
      ]);
    }
    
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
  return settings as JsonObject;
};
