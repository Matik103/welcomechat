
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/widget-settings';
import { WidgetOptions } from '@/types/widget-options';
import { Json } from '@/integrations/supabase/types';

// Update widget settings for a client
export const updateWidgetSettings = async (
  clientId: string,
  settings: WidgetSettings
): Promise<WidgetSettings> => {
  try {
    // Ensure the ai_agents record exists
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('settings')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (agentError && agentError.code !== 'PGRST116') {
      console.error('Error fetching client settings:', agentError);
      throw agentError;
    }

    // Prepare the settings object
    const existingSettings = agentData?.settings || {};
    
    // If existingSettings is a string, parse it
    const parsedExistingSettings = typeof existingSettings === 'string' 
      ? JSON.parse(existingSettings) 
      : existingSettings;
    
    // Merge existing settings with new settings
    const mergedSettings = {
      ...parsedExistingSettings,
      ...settings
    };

    // Update the settings in the ai_agents table
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        settings: mergedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .select('settings')
      .single();

    if (error) {
      console.error('Error updating client settings:', error);
      throw error;
    }

    // Safely convert settings from JSON type to WidgetSettings type
    const settingsObj = data.settings as Record<string, any>;
    
    const widgetSettings: WidgetSettings = {
      agent_name: settingsObj.agent_name || '',
      agent_description: settingsObj.agent_description || '',
      logo_url: settingsObj.logo_url || '',
      logo_storage_path: settingsObj.logo_storage_path || '',
      chat_color: settingsObj.chat_color || '#0ea5e9',
      background_color: settingsObj.background_color || '#ffffff',
      button_color: settingsObj.button_color || '#0ea5e9',
      font_color: settingsObj.font_color || '#000000',
      chat_font_color: settingsObj.chat_font_color || '#ffffff',
      background_opacity: settingsObj.background_opacity || 100,
      button_text: settingsObj.button_text || 'Chat with us',
      position: settingsObj.position || 'right',
      greeting_message: settingsObj.greeting_message || 'Hello! How can I help you today?',
      text_color: settingsObj.text_color || '#000000',
      secondary_color: settingsObj.secondary_color || '#f0f9ff',
      welcome_text: settingsObj.welcome_text || 'Ask me anything about our services!',
      response_time_text: settingsObj.response_time_text || 'We usually respond in a few minutes',
      display_mode: settingsObj.display_mode || 'standard',
    };

    return widgetSettings;
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    throw error;
  }
};

// Get widget settings for a client
export const getWidgetSettings = async (
  clientId: string
): Promise<WidgetSettings> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings, name, agent_description')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (error) {
      console.error('Error fetching widget settings:', error);
      throw error;
    }

    // Get agent name and description from the record if available
    const agentName = data.name || '';
    const agentDescription = data.agent_description || '';
    
    // Extract settings from data or use empty object
    const settings = data.settings || {};
    
    // Parse the settings if it's a string
    const parsedSettings = typeof settings === 'string' 
      ? JSON.parse(settings) 
      : settings;

    // Create default widget settings
    const defaultSettings: WidgetSettings = {
      agent_name: agentName,
      agent_description: agentDescription,
      logo_url: '',
      logo_storage_path: '',
      chat_color: '#0ea5e9',
      background_color: '#ffffff',
      button_color: '#0ea5e9',
      font_color: '#000000',
      chat_font_color: '#ffffff',
      background_opacity: 100,
      button_text: 'Chat with us',
      position: 'right',
      greeting_message: 'Hello! How can I help you today?',
      text_color: '#000000',
      secondary_color: '#f0f9ff',
      welcome_text: 'Ask me anything about our services!',
      response_time_text: 'We usually respond in a few minutes',
      display_mode: 'standard'
    };

    // Merge default settings with parsed settings
    return {
      ...defaultSettings,
      ...parsedSettings
    };
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    
    // Return default widget settings on error
    return {
      agent_name: 'AI Assistant',
      agent_description: '',
      logo_url: '',
      logo_storage_path: '',
      chat_color: '#0ea5e9',
      background_color: '#ffffff',
      button_color: '#0ea5e9',
      font_color: '#000000',
      chat_font_color: '#ffffff',
      background_opacity: 100,
      button_text: 'Chat with us',
      position: 'right',
      greeting_message: 'Hello! How can I help you today?',
      text_color: '#000000',
      secondary_color: '#f0f9ff',
      welcome_text: 'Ask me anything about our services!',
      response_time_text: 'We usually respond in a few minutes',
      display_mode: 'standard'
    };
  }
};
