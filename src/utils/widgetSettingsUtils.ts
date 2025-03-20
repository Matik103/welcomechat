
import { Json } from "@/integrations/supabase/types";
import { WidgetSettings, defaultSettings } from "@/types/widget-settings";

/**
 * Extracts and normalizes widget settings from client data
 */
export const extractWidgetSettings = (clientData: any): WidgetSettings => {
  // Start with default settings
  let settings = { ...defaultSettings };

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
