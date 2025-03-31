
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings } from "@/types/widget-settings";

// Define default widget settings
import { defaultSettings } from "@/types/widget-settings";

/**
 * Get widget settings for a client
 */
export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    // Get the client record first
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings, name, agent_description, logo_url, logo_storage_path')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle(); // Changed from single() to maybeSingle()
    
    if (error) throw error;
    
    if (!data) {
      // If no ai_agents config exists, try to get the client info from clients table
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('client_name, agent_name, widget_settings')
        .eq('id', clientId)
        .maybeSingle();
        
      if (clientError) throw clientError;
      
      if (clientData) {
        // Use data from clients table
        const widgetSettings = clientData.widget_settings || {};
        return {
          ...defaultSettings,
          agent_name: clientData.agent_name || clientData.client_name || defaultSettings.agent_name,
          ...widgetSettings
        };
      }
      
      return { ...defaultSettings };
    }
    
    // Convert to regular object if it's not already
    let settingsObj: Partial<WidgetSettings> = {};
    
    if (data.settings) {
      if (typeof data.settings === 'object') {
        settingsObj = data.settings as Partial<WidgetSettings>;
      } else if (typeof data.settings === 'string') {
        try {
          settingsObj = JSON.parse(data.settings) as Partial<WidgetSettings>;
        } catch (e) {
          settingsObj = {};
        }
      }
    }
    
    // Merge settings with other fields from the record
    const recordSettings = {
      agent_name: data.name || settingsObj.agent_name,
      agent_description: data.agent_description || settingsObj.agent_description,
      logo_url: data.logo_url || settingsObj.logo_url,
      logo_storage_path: data.logo_storage_path || settingsObj.logo_storage_path,
      ...settingsObj
    };
    
    // Ensure we have a complete settings object by merging with defaults
    const mergedSettings = {
      ...defaultSettings,
      ...recordSettings
    };
    
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
    
    // Check if an agent config record exists
    const { data, error: checkError } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    // Extract fields that should be stored in separate columns
    const { agent_name, agent_description, logo_url, logo_storage_path, ...otherSettings } = updatedSettings;
    
    if (data) {
      // Update existing record
      const { error } = await supabase
        .from('ai_agents')
        .update({
          settings: otherSettings,
          name: agent_name,
          agent_description: agent_description,
          logo_url: logo_url,
          logo_storage_path: logo_storage_path
        })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
      
      if (error) throw error;
    } else {
      // Create new record if none exists
      const { error } = await supabase
        .from('ai_agents')
        .insert({
          client_id: clientId,
          name: agent_name,
          agent_description: agent_description,
          logo_url: logo_url,
          logo_storage_path: logo_storage_path,
          settings: otherSettings,
          interaction_type: 'config'
        });
        
      if (error) throw error;
    }
    
    // Also update the clients table to ensure bidirectional sync
    const { error: clientUpdateError } = await supabase
      .from('clients')
      .update({
        agent_name: agent_name,
        widget_settings: {
          ...otherSettings,
          logo_url: logo_url,
          logo_storage_path: logo_storage_path
        }
      })
      .eq('id', clientId);
      
    if (clientUpdateError) {
      console.error('Warning: Unable to sync with clients table:', clientUpdateError);
      // Continue anyway, since the primary storage is now ai_agents
    }
  } catch (error) {
    console.error('Error updating widget settings:', error);
    throw error;
  }
}
