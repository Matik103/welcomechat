
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings } from "@/types/client-form";

// Define default widget settings
const defaultSettings: WidgetSettings = {
  agent_name: 'AI Assistant',
  agent_description: 'Your helpful AI assistant',
  logo_url: '',
  logo_storage_path: '',
  chat_color: '#3b82f6',
  background_color: '#ffffff',
  button_color: '#3b82f6',
  font_color: '#000000',
  chat_font_color: '#ffffff',
  background_opacity: 0.9,
  button_text: 'Chat',
  position: 'right',
  greeting_message: 'Hello! How can I help you today?',
  text_color: '#000000',
  secondary_color: '#f3f4f6',
  welcome_text: 'Welcome to our chat assistant',
  response_time_text: 'Responds in a few seconds',
  display_mode: 'auto'
};

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
    
    // Make sure button_color is set if it's missing
    if (!mergedSettings.button_color) {
      mergedSettings.button_color = defaultSettings.button_color;
    }
    
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
    
    // Make sure button_color is set if it's missing
    if (!updatedSettings.button_color) {
      updatedSettings.button_color = defaultSettings.button_color;
    }
    
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
