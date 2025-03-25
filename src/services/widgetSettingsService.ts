
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/widget-settings';
import { toast } from 'sonner';
import { createClientActivity } from './clientActivityService';
import { defaultSettings } from '@/types/widget-settings';

export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (error) {
      console.error('Error fetching widget settings:', error);
      throw error;
    }

    // Ensure we return a proper WidgetSettings object by extracting needed fields
    const settings = data?.settings as Record<string, any> || {};
    
    // Return widget settings with defaults for missing values
    return {
      agent_name: settings.agent_name || '',
      agent_description: settings.agent_description || '',
      logo_url: settings.logo_url || '',
      logo_storage_path: settings.logo_storage_path || '',
      chat_color: settings.chat_color || defaultSettings.chat_color,
      background_color: settings.background_color || defaultSettings.background_color,
      text_color: settings.text_color || defaultSettings.text_color,
      secondary_color: settings.secondary_color || defaultSettings.secondary_color,
      position: settings.position || defaultSettings.position,
      welcome_text: settings.welcome_text || defaultSettings.welcome_text,
      response_time_text: settings.response_time_text || defaultSettings.response_time_text,
      display_mode: settings.display_mode || defaultSettings.display_mode,
    };
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    return defaultSettings;
  }
}

export async function updateWidgetSettings(
  clientId: string,
  settings: WidgetSettings
): Promise<WidgetSettings> {
  try {
    // Convert WidgetSettings to Record<string, any> to match jsonb type
    const settingsObject: Record<string, any> = {
      agent_name: settings.agent_name,
      agent_description: settings.agent_description,
      logo_url: settings.logo_url,
      logo_storage_path: settings.logo_storage_path,
      chat_color: settings.chat_color,
      background_color: settings.background_color,
      text_color: settings.text_color,
      secondary_color: settings.secondary_color,
      position: settings.position,
      welcome_text: settings.welcome_text,
      response_time_text: settings.response_time_text,
      display_mode: settings.display_mode
    };

    const { data, error } = await supabase
      .from('ai_agents')
      .update({ settings: settingsObject })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .select('settings')
      .single();

    if (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }

    // Log the activity
    await createClientActivity(
      clientId,
      'widget_settings_updated',
      'Updated widget settings',
      { settings: settingsObject }
    );

    toast.success('Widget settings updated successfully');
    
    // Ensure we return a proper WidgetSettings object
    const updatedSettings = data?.settings as Record<string, any> || settings;
    
    return {
      agent_name: updatedSettings.agent_name || '',
      agent_description: updatedSettings.agent_description || '',
      logo_url: updatedSettings.logo_url || '',
      logo_storage_path: updatedSettings.logo_storage_path || '',
      chat_color: updatedSettings.chat_color || defaultSettings.chat_color,
      background_color: updatedSettings.background_color || defaultSettings.background_color,
      text_color: updatedSettings.text_color || defaultSettings.text_color,
      secondary_color: updatedSettings.secondary_color || defaultSettings.secondary_color,
      position: updatedSettings.position || defaultSettings.position,
      welcome_text: updatedSettings.welcome_text || defaultSettings.welcome_text,
      response_time_text: updatedSettings.response_time_text || defaultSettings.response_time_text,
      display_mode: updatedSettings.display_mode || defaultSettings.display_mode,
    };
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    toast.error(`Failed to update widget settings: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
