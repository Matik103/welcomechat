
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/client-form';
import { createClientActivity } from './clientActivityService';

/**
 * Get widget settings for a client
 */
export const getWidgetSettings = async (clientId: string): Promise<WidgetSettings> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('name, settings')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();
    
    if (error) {
      console.error(`Error fetching widget settings for client ${clientId}:`, error);
      throw error;
    }
    
    // Extract widget settings from the response
    const settings = data.settings || {};
    
    return {
      agent_name: data.name || 'AI Assistant',
      agent_description: typeof settings === 'object' ? (settings.agent_description as string) || '' : '',
      logo_url: typeof settings === 'object' ? (settings.logo_url as string) || '' : '',
      logo_storage_path: typeof settings === 'object' ? (settings.logo_storage_path as string) || '' : '',
      chat_color: typeof settings === 'object' ? (settings.chat_color as string) || '#3b82f6' : '#3b82f6',
      background_color: typeof settings === 'object' ? (settings.background_color as string) || '#ffffff' : '#ffffff',
      button_color: typeof settings === 'object' ? (settings.button_color as string) || '#3b82f6' : '#3b82f6',
      font_color: typeof settings === 'object' ? (settings.font_color as string) || '#000000' : '#000000',
      chat_font_color: typeof settings === 'object' ? (settings.chat_font_color as string) || '#ffffff' : '#ffffff',
      background_opacity: typeof settings === 'object' ? (settings.background_opacity as number) || 1 : 1,
      button_text: typeof settings === 'object' ? (settings.button_text as string) || 'Chat with Us' : 'Chat with Us',
      position: typeof settings === 'object' ? (settings.position as 'left' | 'right') || 'right' : 'right',
      greeting_message: typeof settings === 'object' ? (settings.greeting_message as string) || 'Hello! How can I help you today?' : 'Hello! How can I help you today?'
    };
  } catch (error) {
    console.error(`Error in getWidgetSettings for client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Update widget settings for a client
 */
export const updateWidgetSettings = async (clientId: string, settings: Partial<WidgetSettings>): Promise<void> => {
  try {
    // First, get existing settings to merge with updates
    const { data: existingData, error: fetchError } = await supabase
      .from('ai_agents')
      .select('settings')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();
    
    if (fetchError) {
      console.error(`Error fetching existing settings for client ${clientId}:`, fetchError);
      throw fetchError;
    }
    
    // Merge existing settings with updates
    const existingSettings = existingData.settings || {};
    const updatedSettings = {
      ...existingSettings,
      ...settings,
      updated_at: new Date().toISOString()
    };
    
    // Update the agent name if provided
    let updateQuery = supabase
      .from('ai_agents')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      });
    
    // Update the agent name if provided
    if (settings.agent_name) {
      updateQuery = supabase
        .from('ai_agents')
        .update({
          name: settings.agent_name,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        });
    }
    
    const { error: updateError } = await updateQuery
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
    
    if (updateError) {
      console.error(`Error updating widget settings for client ${clientId}:`, updateError);
      throw updateError;
    }
    
    // Log the widget settings update activity
    await createClientActivity('widget_settings_updated', 'Widget settings updated', {
      client_id: clientId,
      settings_updated: Object.keys(settings)
    });
  } catch (error) {
    console.error(`Error in updateWidgetSettings for client ${clientId}:`, error);
    throw error;
  }
};
