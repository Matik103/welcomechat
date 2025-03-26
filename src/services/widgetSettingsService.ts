
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/widget-settings';
import { defaultSettings } from '@/types/widget-settings';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

export interface IWidgetSettings extends WidgetSettings {}

/**
 * Get widget settings for a client
 */
export const getWidgetSettings = async (clientId: string): Promise<WidgetSettings> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings, name, agent_description, logo_url, logo_storage_path')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (error) {
      console.error('Error getting widget settings:', error);
      throw error;
    }

    // If no data returned, return default settings
    if (!data) {
      return defaultSettings;
    }

    // Extract widget settings properties with type safety
    const settings = data.settings || {};
    
    // Merge default settings with stored settings
    const mergedSettings: WidgetSettings = {
      ...defaultSettings,
      agent_name: settings.agent_name || data.name || defaultSettings.agent_name,
      agent_description: settings.agent_description || data.agent_description || defaultSettings.agent_description,
      logo_url: settings.logo_url || data.logo_url || defaultSettings.logo_url,
      logo_storage_path: settings.logo_storage_path || data.logo_storage_path || defaultSettings.logo_storage_path,
    };
    
    // Copy any additional properties from settings
    if (typeof settings === 'object') {
      Object.entries(settings).forEach(([key, value]) => {
        if (key !== 'agent_name' && 
            key !== 'agent_description' && 
            key !== 'logo_url' && 
            key !== 'logo_storage_path') {
          // @ts-ignore - we're copying properties dynamically
          mergedSettings[key] = value;
        }
      });
    }

    return mergedSettings;
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    return defaultSettings;
  }
};

/**
 * Update widget settings for a client
 */
export const updateWidgetSettings = async (clientId: string, settings: WidgetSettings): Promise<WidgetSettings> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        settings: settings,
        name: settings.agent_name,
        agent_description: settings.agent_description,
        logo_url: settings.logo_url,
        logo_storage_path: settings.logo_storage_path,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .select();

    if (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }

    // Log widget settings update activity
    await callRpcFunctionSafe('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'widget_settings_updated',
      description_param: 'Widget settings updated',
      metadata_param: { updated_at: new Date().toISOString() }
    });

    return settings;
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    throw error;
  }
};
