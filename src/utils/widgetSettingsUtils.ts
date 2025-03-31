
import { JsonObject } from "@/types/supabase-extensions";
import { WidgetSettings, defaultSettings } from "@/types/widget-settings";
import { execSql } from "@/utils/rpcUtils";

/**
 * Extracts and normalizes widget settings from client data
 */
export const extractWidgetSettings = (clientData: any): WidgetSettings => {
  // Start with default settings
  let settings: WidgetSettings = { ...defaultSettings };

  if (!clientData) {
    return settings;
  }

  try {
    // Extract settings from widget_settings property if it exists
    if (clientData.widget_settings && typeof clientData.widget_settings === 'object') {
      settings = {
        ...settings,
        ...clientData.widget_settings
      };
    }
    
    // If there's a settings property and it's an object (from ai_agents table)
    if (clientData.settings && typeof clientData.settings === 'object') {
      settings = {
        ...settings,
        ...clientData.settings
      };
    }

    // Ensure agent name is set
    if (clientData.agent_name && !settings.agent_name) {
      settings.agent_name = clientData.agent_name;
    } else if (clientData.name && !settings.agent_name) {
      settings.agent_name = clientData.name;
    }

    // Ensure agent description is set
    if (clientData.agent_description && !settings.agent_description) {
      settings.agent_description = clientData.agent_description;
    }

    // Ensure logo URL is set
    if (clientData.logo_url && !settings.logo_url) {
      settings.logo_url = clientData.logo_url;
    }

    // Ensure logo storage path is set
    if (clientData.logo_storage_path && !settings.logo_storage_path) {
      settings.logo_storage_path = clientData.logo_storage_path;
    }

    return settings;
  } catch (error) {
    console.error("Error extracting widget settings:", error);
    return defaultSettings;
  }
};

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
          logo_storage_path = $5
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
          interaction_type
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'config'
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
