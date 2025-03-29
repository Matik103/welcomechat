
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings } from "@/types/widget-settings";

// Define default widget settings
import { defaultSettings } from "@/types/widget-settings";

/**
 * Get widget settings for a client
 */
export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    // Get the client record first
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings, name, agent_description, logo_url, logo_storage_path')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return { ...defaultSettings };
    }
    
    // Convert to regular object if it's not already
    let settingsObj = { ...defaultSettings };
    
    if (data.settings && typeof data.settings === 'object') {
      settingsObj = {
        ...settingsObj,
        ...data.settings
      };
    } else if (data.settings && typeof data.settings === 'string') {
      try {
        const parsedSettings = JSON.parse(data.settings);
        settingsObj = {
          ...settingsObj,
          ...parsedSettings
        };
      } catch (e) {
        console.error("Error parsing settings:", e);
      }
    }
    
    // Ensure agent name is set from the name field if not in settings
    if (data.name && !settingsObj.agent_name) {
      settingsObj.agent_name = data.name;
    }

    // Ensure agent description is set
    if (data.agent_description && !settingsObj.agent_description) {
      settingsObj.agent_description = data.agent_description;
    }

    // Ensure logo URL is set
    if (data.logo_url && !settingsObj.logo_url) {
      settingsObj.logo_url = data.logo_url;
    }

    // Ensure logo storage path is set
    if (data.logo_storage_path && !settingsObj.logo_storage_path) {
      settingsObj.logo_storage_path = data.logo_storage_path;
    }
    
    return settingsObj as WidgetSettings;
  } catch (error) {
    console.error('Error getting widget settings:', error);
    return { ...defaultSettings };
  }
}

/**
 * Update widget settings for a client
 */
export async function updateWidgetSettings(
  clientId: string,
  settings: Partial<WidgetSettings>
): Promise<void> {
  try {
    // First get the current settings
    const currentSettings = await getWidgetSettings(clientId);
    
    // Merge with the new settings
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Update the settings in the database
    const { error } = await supabase
      .from('ai_agents')
      .update({
        settings: updatedSettings,
        name: updatedSettings.agent_name, // Also update the name field directly
        agent_description: updatedSettings.agent_description, // Update agent_description field
        logo_url: updatedSettings.logo_url, // Update logo_url field
        logo_storage_path: updatedSettings.logo_storage_path // Update logo_storage_path field
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating widget settings:', error);
    throw error;
  }
}
