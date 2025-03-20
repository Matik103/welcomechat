
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings, defaultSettings } from "@/types/widget-settings";
import { execSql } from "./rpcUtils";
import { Json } from "@/integrations/supabase/types";

/**
 * Gets the widget settings for a client
 * @param clientId The client ID
 * @returns The widget settings
 */
export const getWidgetSettings = async (clientId: string): Promise<WidgetSettings> => {
  if (!clientId) {
    return defaultSettings;
  }

  try {
    // Use SQL query via RPC instead of direct table access
    const query = `
      SELECT settings FROM ai_agents WHERE id = '${clientId}' LIMIT 1
    `;
    
    const result = await execSql(query);
    
    if (result && result.length > 0 && result[0].settings) {
      // Merge the default settings with the stored settings
      return {
        ...defaultSettings,
        ...(typeof result[0].settings === 'object' ? result[0].settings : {})
      };
    }
    
    return defaultSettings;
  } catch (error) {
    console.error("Error fetching widget settings:", error);
    return defaultSettings;
  }
};

/**
 * Updates the widget settings for a client
 * @param clientId The client ID
 * @param settings The new settings to apply
 * @returns True if the update was successful
 */
export const updateWidgetSettings = async (
  clientId: string,
  settings: Partial<WidgetSettings>
): Promise<boolean> => {
  if (!clientId) {
    return false;
  }

  try {
    // First get the current settings
    const currentSettings = await getWidgetSettings(clientId);
    
    // Merge the current settings with the new settings
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Update using SQL via RPC instead of direct table access
    const updateQuery = `
      UPDATE ai_agents 
      SET settings = '${JSON.stringify(updatedSettings)}'::jsonb,
          updated_at = NOW()
      WHERE id = '${clientId}'
      RETURNING id
    `;
    
    const result = await execSql(updateQuery);
    
    return result && result.length > 0;
  } catch (error) {
    console.error("Error updating widget settings:", error);
    return false;
  }
};

/**
 * Converts widget settings to a JSON object compatible with the database
 * @param settings The widget settings
 * @returns A JSON object
 */
export const widgetSettingsToJson = (settings: Partial<WidgetSettings>): Json => {
  return settings as unknown as Json;
};
