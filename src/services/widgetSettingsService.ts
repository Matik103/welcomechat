
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/client-form';
import { createClientActivity } from './clientActivityService';
import { execSql } from '@/utils/rpcUtils';

export interface IWidgetSettings {
  agent_name: string;
  agent_description: string;
  logo_url: string;
  logo_storage_path: string;
  chat_color: string;
  background_color: string;
  button_color: string;
  font_color: string;
  chat_font_color: string;
  background_opacity: number;
  button_text: string;
  position: "left" | "right";
  greeting_message: string;
  text_color: string;
  secondary_color: string;
  welcome_text: string;
  response_time_text: string;
  display_mode: string;
}

export const getWidgetSettings = async (clientId: string): Promise<WidgetSettings> => {
  try {
    // Get settings from settings table by client_id
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching widget settings:', error);
      throw error;
    }

    // Extract settings or provide defaults
    const settings = data?.settings || {};
    
    return {
      agent_name: typeof settings === 'object' && settings.agent_name ? String(settings.agent_name) : 'AI Assistant',
      agent_description: typeof settings === 'object' && settings.agent_description ? String(settings.agent_description) : '',
      logo_url: typeof settings === 'object' && settings.logo_url ? String(settings.logo_url) : '',
      logo_storage_path: typeof settings === 'object' && settings.logo_storage_path ? String(settings.logo_storage_path) : '',
      chat_color: typeof settings === 'object' && settings.chat_color ? String(settings.chat_color) : '#2563EB',
      background_color: typeof settings === 'object' && settings.background_color ? String(settings.background_color) : '#FFFFFF',
      button_color: typeof settings === 'object' && settings.button_color ? String(settings.button_color) : '#2563EB',
      font_color: typeof settings === 'object' && settings.font_color ? String(settings.font_color) : '#FFFFFF',
      chat_font_color: typeof settings === 'object' && settings.chat_font_color ? String(settings.chat_font_color) : '#111827',
      background_opacity: typeof settings === 'object' && settings.background_opacity ? Number(settings.background_opacity) : 0.9,
      button_text: typeof settings === 'object' && settings.button_text ? String(settings.button_text) : 'Chat',
      position: typeof settings === 'object' && settings.position === 'left' ? 'left' : 'right',
      greeting_message: typeof settings === 'object' && settings.greeting_message ? String(settings.greeting_message) : 'Hello! How can I help you today?',
      text_color: typeof settings === 'object' && settings.text_color ? String(settings.text_color) : '#111827',
      secondary_color: typeof settings === 'object' && settings.secondary_color ? String(settings.secondary_color) : '#6B7280',
      welcome_text: typeof settings === 'object' && settings.welcome_text ? String(settings.welcome_text) : 'Welcome to our chat!',
      response_time_text: typeof settings === 'object' && settings.response_time_text ? String(settings.response_time_text) : 'Typically replies within minutes',
      display_mode: typeof settings === 'object' && settings.display_mode ? String(settings.display_mode) : 'standard'
    };
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    // Return default settings on error
    return {
      agent_name: 'AI Assistant',
      agent_description: '',
      logo_url: '',
      logo_storage_path: '',
      chat_color: '#2563EB',
      background_color: '#FFFFFF',
      button_color: '#2563EB',
      font_color: '#FFFFFF',
      chat_font_color: '#111827',
      background_opacity: 0.9,
      button_text: 'Chat',
      position: 'right',
      greeting_message: 'Hello! How can I help you today?',
      text_color: '#111827',
      secondary_color: '#6B7280',
      welcome_text: 'Welcome to our chat!',
      response_time_text: 'Typically replies within minutes',
      display_mode: 'standard'
    };
  }
};

export const updateWidgetSettings = async (clientId: string, settings: Partial<WidgetSettings>): Promise<void> => {
  try {
    // Get the current settings first
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (error) {
      console.error('Error getting current settings:', error);
      throw error;
    }

    // Merge current settings with new settings
    const currentSettings = data.settings || {};
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };

    // Update settings in the database
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');

    if (updateError) {
      console.error('Error updating widget settings:', updateError);
      throw updateError;
    }

    // Log widget settings update activity
    await createClientActivity(
      clientId,
      'widget_settings_updated',
      "Widget settings updated",
      {
        fields_updated: Object.keys(settings)
      }
    );
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    throw error;
  }
};
