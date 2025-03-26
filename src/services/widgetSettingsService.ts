
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/client-form';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

export interface IWidgetSettings extends WidgetSettings {}

/**
 * Get widget settings for a client
 */
export const getWidgetSettings = async (clientId: string): Promise<WidgetSettings> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('widget_settings, agent_name, agent_description, logo_url, logo_storage_path')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Error getting widget settings:', error);
      throw error;
    }

    // Default widget settings
    const defaultSettings: WidgetSettings = {
      agent_name: data.agent_name || 'AI Assistant',
      agent_description: data.agent_description || 'Your AI assistant',
      logo_url: data.logo_url || '',
      logo_storage_path: data.logo_storage_path || '',
      chat_color: '#3b82f6',
      background_color: '#ffffff',
      button_color: '#3b82f6',
      font_color: '#1e293b',
      chat_font_color: '#ffffff',
      background_opacity: 0.8,
      button_text: 'Chat with Us',
      position: 'right',
      greeting_message: 'Hello! How can I help you today?',
      text_color: '#1e293b',
      secondary_color: '#f1f5f9',
      welcome_text: 'Ask me anything about our products or services.',
      response_time_text: 'We typically respond in a few minutes.',
      display_mode: 'popup'
    };

    // Merge default settings with stored settings
    const storedSettings = data.widget_settings || {};
    const mergedSettings: WidgetSettings = {
      ...defaultSettings,
      // Safely access widget_settings properties
      agent_name: storedSettings.agent_name ?? data.agent_name ?? defaultSettings.agent_name,
      agent_description: storedSettings.agent_description ?? data.agent_description ?? defaultSettings.agent_description,
      logo_url: storedSettings.logo_url ?? data.logo_url ?? defaultSettings.logo_url,
      logo_storage_path: storedSettings.logo_storage_path ?? data.logo_storage_path ?? defaultSettings.logo_storage_path,
      chat_color: storedSettings.chat_color ?? defaultSettings.chat_color,
      background_color: storedSettings.background_color ?? defaultSettings.background_color,
      button_color: storedSettings.button_color ?? defaultSettings.button_color,
      font_color: storedSettings.font_color ?? defaultSettings.font_color,
      chat_font_color: storedSettings.chat_font_color ?? defaultSettings.chat_font_color,
      background_opacity: storedSettings.background_opacity ?? defaultSettings.background_opacity,
      button_text: storedSettings.button_text ?? defaultSettings.button_text,
      position: (storedSettings.position as "left" | "right") ?? defaultSettings.position,
      greeting_message: storedSettings.greeting_message ?? defaultSettings.greeting_message,
      text_color: storedSettings.text_color ?? defaultSettings.text_color,
      secondary_color: storedSettings.secondary_color ?? defaultSettings.secondary_color,
      welcome_text: storedSettings.welcome_text ?? defaultSettings.welcome_text,
      response_time_text: storedSettings.response_time_text ?? defaultSettings.response_time_text,
      display_mode: storedSettings.display_mode ?? defaultSettings.display_mode
    };

    return mergedSettings;
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    throw error;
  }
};

/**
 * Update widget settings for a client
 */
export const updateWidgetSettings = async (clientId: string, settings: WidgetSettings): Promise<WidgetSettings> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        widget_settings: settings
      })
      .eq('id', clientId)
      .select('widget_settings');

    if (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }

    return settings;
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    throw error;
  }
};
