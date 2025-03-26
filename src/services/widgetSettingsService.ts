
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings, defaultSettings } from '@/types/widget-settings';

// Get widget settings for a client
export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('widget_settings, agent_name, agent_description, logo_url, logo_storage_path')
      .eq('id', clientId)
      .single();
    
    if (error) {
      console.error('Error fetching widget settings:', error);
      throw error;
    }
    
    // If no settings or null/undefined, return default settings
    if (!data || !data.widget_settings) {
      return {
        ...defaultSettings,
        agent_name: data?.agent_name || 'AI Assistant',
        agent_description: data?.agent_description || 'Your helpful AI assistant',
        logo_url: data?.logo_url || '',
        logo_storage_path: data?.logo_storage_path || ''
      };
    }
    
    // For string settings (JSON string), parse them first
    let parsedSettings: Record<string, any>;
    if (typeof data.widget_settings === 'string') {
      try {
        parsedSettings = JSON.parse(data.widget_settings);
      } catch (e) {
        console.error('Error parsing widget_settings string:', e);
        parsedSettings = {};
      }
    } else if (typeof data.widget_settings === 'object') {
      // For object settings, use directly
      parsedSettings = data.widget_settings as Record<string, any>;
    } else {
      // For any other types, use empty object
      parsedSettings = {};
    }
    
    // Merge settings with defaults, prioritizing existing settings
    return {
      ...defaultSettings,
      ...parsedSettings,
      agent_name: data.agent_name || parsedSettings.agent_name || defaultSettings.agent_name,
      agent_description: data.agent_description || parsedSettings.agent_description || defaultSettings.agent_description,
      logo_url: data.logo_url || parsedSettings.logo_url || defaultSettings.logo_url,
      logo_storage_path: data.logo_storage_path || parsedSettings.logo_storage_path || defaultSettings.logo_storage_path
    };
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    return defaultSettings;
  }
}

// Update widget settings for a client
export async function updateWidgetSettings(clientId: string, settings: WidgetSettings): Promise<WidgetSettings> {
  try {
    // First, update the agent_name, agent_description, logo fields on the ai_agents table
    const { error: agentError } = await supabase
      .from('ai_agents')
      .update({
        agent_name: settings.agent_name,
        agent_description: settings.agent_description,
        logo_url: settings.logo_url,
        logo_storage_path: settings.logo_storage_path
      })
      .eq('id', clientId);
    
    if (agentError) {
      console.error('Error updating agent fields:', agentError);
      throw agentError;
    }
    
    // Then, update the widget_settings field with the full settings object
    const { error: settingsError } = await supabase
      .from('ai_agents')
      .update({
        widget_settings: settings
      })
      .eq('id', clientId);
    
    if (settingsError) {
      console.error('Error updating widget settings:', settingsError);
      throw settingsError;
    }
    
    return settings;
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    throw error;
  }
}
