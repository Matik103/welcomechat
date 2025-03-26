
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/widget-settings';
import { createClientActivity } from './clientActivityService';
import { Json } from '@/integrations/supabase/types';
import { execSql } from '@/utils/rpcUtils';

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
    
    // Extract widget settings from the response, safely handle JSON types
    const settings = data.settings as Record<string, any> || {};
    
    return {
      agent_name: data.name || 'AI Assistant',
      agent_description: settings.agent_description || '',
      logo_url: settings.logo_url || '',
      logo_storage_path: settings.logo_storage_path || '',
      chat_color: settings.chat_color || '#3b82f6',
      background_color: settings.background_color || '#ffffff',
      button_color: settings.button_color || '#3b82f6',
      font_color: settings.font_color || '#000000',
      chat_font_color: settings.chat_font_color || '#ffffff',
      background_opacity: settings.background_opacity || 1,
      button_text: settings.button_text || 'Chat with Us',
      position: (settings.position as "left" | "right") || 'right',
      greeting_message: settings.greeting_message || 'Hello! How can I help you today?'
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
    const existingSettings = existingData?.settings as Record<string, any> || {};
    const updatedSettings = {
      ...existingSettings,
      ...(settings as Record<string, any>),
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
    await execSql(`
      SELECT log_client_activity(
        $1,
        $2,
        $3,
        $4
      )
    `, [clientId, 'widget_settings_updated', 'Widget settings updated', JSON.stringify({
      settings_updated: Object.keys(settings)
    })]);
  } catch (error) {
    console.error(`Error in updateWidgetSettings for client ${clientId}:`, error);
    throw error;
  }
};
