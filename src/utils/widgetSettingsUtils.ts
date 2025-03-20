
import { JsonObject } from "@/types/supabase-extensions";
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

/**
 * Retrieves widget settings for a client from the database
 */
export const getWidgetSettings = async (clientId: string): Promise<WidgetSettings> => {
  try {
    // First try to get settings from the clients table
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('widget_settings, agent_name, logo_url, logo_storage_path')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error("Error fetching client widget settings:", clientError);
      // Fallback to ai_agents table
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('settings, name, logo_url, logo_storage_path, agent_description')
        .eq('client_id', clientId)
        .single();
      
      if (agentError) {
        console.error("Error fetching agent settings:", agentError);
        return defaultSettings;
      }
      
      return extractWidgetSettings(agentData);
    }
    
    return extractWidgetSettings(clientData);
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
    // Update settings in clients table
    const { error: clientError } = await supabase
      .from('clients')
      .update({ 
        widget_settings: settings,
        agent_name: settings.agent_name
      })
      .eq('id', clientId);
    
    if (clientError) {
      console.error("Error updating client widget settings:", clientError);
      return false;
    }
    
    // Also sync settings to ai_agents table if it exists
    const { error: agentError } = await supabase
      .from('ai_agents')
      .update({ 
        settings: settings,
        name: settings.agent_name,
        agent_description: settings.agent_description,
        logo_url: settings.logo_url,
        logo_storage_path: settings.logo_storage_path
      })
      .eq('client_id', clientId);
    
    if (agentError) {
      console.warn("Could not sync settings to ai_agents table:", agentError);
      // This is not critical, we still consider the update successful
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

// Import supabase at the end to avoid circular dependencies
import { supabase } from "@/integrations/supabase/client";
