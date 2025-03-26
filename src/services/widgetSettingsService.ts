
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings, defaultSettings } from '@/types/widget-settings';
import { safeParseSettings } from '@/utils/clientSettingsUtils';
import { execSql } from '@/utils/rpcUtils';

/**
 * Gets widget settings for a client
 */
export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings, name, logo_url, logo_storage_path, agent_description')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();
    
    if (error) {
      console.error('Error fetching widget settings:', error);
      return defaultSettings;
    }
    
    // Create a settings object from the data
    const settingsObj = {
      agent_name: data.name || defaultSettings.agent_name,
      agent_description: data.agent_description || defaultSettings.agent_description,
      logo_url: data.logo_url || defaultSettings.logo_url,
      logo_storage_path: data.logo_storage_path || defaultSettings.logo_storage_path,
      ...safeParseSettings(data.settings)
    };
    
    // Ensure all default values are present
    return {
      ...defaultSettings,
      ...settingsObj
    };
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    return defaultSettings;
  }
}

/**
 * Updates widget settings for a client
 */
export async function updateWidgetSettings(clientId: string, settings: Partial<WidgetSettings>): Promise<boolean> {
  try {
    // Prepare the settings to update
    const settingsToUpdate = { ...settings };
    
    // Update the settings in the AI agent
    const { error } = await supabase
      .from('ai_agents')
      .update({
        name: settings.agent_name,
        agent_description: settings.agent_description,
        logo_url: settings.logo_url,
        logo_storage_path: settings.logo_storage_path,
        settings: settingsToUpdate
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
    
    if (error) {
      console.error('Error updating widget settings:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    return false;
  }
}
