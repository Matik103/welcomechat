
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/widget-settings';

// Get widget settings for a client
export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings, name, agent_description')
      .eq('id', clientId)
      .single();
    
    if (error) {
      console.error('Error fetching widget settings:', error);
      throw error;
    }
    
    // Get the settings object or create a default one
    const settings = data.settings || {};
    
    // Create a consistent widget settings object
    const widgetSettings: WidgetSettings = {
      agent_name: settings.agent_name || data.name || 'AI Assistant',
      agent_description: settings.agent_description || data.agent_description || 'Your helpful AI assistant',
      logo_url: settings.logo_url || '',
      logo_storage_path: settings.logo_storage_path || '',
      chat_color: settings.chat_color || '#4F46E5',
      background_color: settings.background_color || '#FFFFFF',
      button_color: settings.button_color || '#4F46E5',
      font_color: settings.font_color || '#1F2937',
      chat_font_color: settings.chat_font_color || '#FFFFFF',
      background_opacity: settings.background_opacity || 1,
      button_text: settings.button_text || 'Chat with us',
      position: settings.position || 'right',
      greeting_message: settings.greeting_message || 'Hello! How can I help you today?',
      text_color: settings.text_color || '#1F2937',
      secondary_color: settings.secondary_color || '#6B7280',
      welcome_text: settings.welcome_text || 'Welcome to our chat!',
      response_time_text: settings.response_time_text || 'Typically responds in a few minutes',
      display_mode: settings.display_mode || 'standard'
    };
    
    return widgetSettings;
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    // Return default settings on error
    return getDefaultWidgetSettings();
  }
}

// Update widget settings for a client
export async function updateWidgetSettings(clientId: string, settings: Partial<WidgetSettings>): Promise<void> {
  try {
    // First get the current settings
    const { data, error: fetchError } = await supabase
      .from('ai_agents')
      .select('settings')
      .eq('id', clientId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current settings:', fetchError);
      throw fetchError;
    }
    
    // Merge the new settings with existing ones
    const currentSettings = data.settings || {};
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Update the agent name and description in their dedicated columns as well
    const updateData: any = {
      settings: updatedSettings,
      updated_at: new Date().toISOString()
    };
    
    // If agent_name is being updated, also update the name column
    if (settings.agent_name) {
      updateData.name = settings.agent_name;
    }
    
    // If agent_description is being updated, also update the agent_description column
    if (settings.agent_description) {
      updateData.agent_description = settings.agent_description;
    }
    
    const { error } = await supabase
      .from('ai_agents')
      .update(updateData)
      .eq('id', clientId);
    
    if (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    throw error;
  }
}

// Get default widget settings
export function getDefaultWidgetSettings(): WidgetSettings {
  return {
    agent_name: 'AI Assistant',
    agent_description: 'Your helpful AI assistant',
    logo_url: '',
    logo_storage_path: '',
    chat_color: '#4F46E5',
    background_color: '#FFFFFF',
    button_color: '#4F46E5',
    font_color: '#1F2937',
    chat_font_color: '#FFFFFF',
    background_opacity: 1,
    button_text: 'Chat with us',
    position: 'right',
    greeting_message: 'Hello! How can I help you today?',
    text_color: '#1F2937',
    secondary_color: '#6B7280',
    welcome_text: 'Welcome to our chat!',
    response_time_text: 'Typically responds in a few minutes',
    display_mode: 'standard'
  };
}
