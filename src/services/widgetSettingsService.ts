
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings } from "@/types/client-form";

// Define default widget settings - imported from client-form.ts
import { defaultSettings } from "@/types/client-form";

/**
 * Get widget settings for a client
 */
export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    // Get the client record first
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings')
      .eq('id', clientId)
      .eq('interaction_type', 'config')
      .single();
    
    if (error) throw error;
    
    if (!data || !data.settings) {
      return { ...defaultSettings };
    }
    
    // Convert to regular object if it's not already
    let settingsObj = {};
    
    if (typeof data.settings === 'object') {
      settingsObj = data.settings;
    } else if (typeof data.settings === 'string') {
      try {
        settingsObj = JSON.parse(data.settings);
      } catch (e) {
        settingsObj = {};
      }
    }
    
    // Ensure we have a complete settings object by merging with defaults
    const mergedSettings = {
      ...defaultSettings,
      ...settingsObj
    };
    
    return mergedSettings as WidgetSettings;
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
        settings: updatedSettings
      })
      .eq('id', clientId)
      .eq('interaction_type', 'config');
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating widget settings:', error);
    throw error;
  }
}
