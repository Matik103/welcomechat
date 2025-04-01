
import { supabase } from "@/integrations/supabase/client";
import { WidgetSettings } from "@/types/widget-settings";

// Define default widget settings
import { defaultSettings } from "@/types/widget-settings";

/**
 * Get widget settings for a client
 */
export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    console.log(`Getting widget settings for client: ${clientId}`);
    
    // Get settings from ai_agents table (primary source)
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('settings, name, agent_description, logo_url, logo_storage_path')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle();
    
    if (agentError) {
      console.error('Error fetching from ai_agents:', agentError);
    }
    
    if (agentData) {
      console.log('Found settings in ai_agents table:', agentData);
      
      // Convert to regular object if it's not already
      let settingsObj: Partial<WidgetSettings> = {};
      
      if (agentData.settings) {
        if (typeof agentData.settings === 'object') {
          settingsObj = agentData.settings as Partial<WidgetSettings>;
        } else if (typeof agentData.settings === 'string') {
          try {
            settingsObj = JSON.parse(agentData.settings) as Partial<WidgetSettings>;
          } catch (e) {
            settingsObj = {};
          }
        }
      }
      
      // Merge settings with other fields from the record
      const recordSettings = {
        agent_name: agentData.name || settingsObj.agent_name || defaultSettings.agent_name,
        agent_description: agentData.agent_description || settingsObj.agent_description,
        logo_url: agentData.logo_url || settingsObj.logo_url,
        logo_storage_path: agentData.logo_storage_path || settingsObj.logo_storage_path,
        ...settingsObj
      };
      
      // Ensure we have a complete settings object by merging with defaults
      const mergedSettings = {
        ...defaultSettings,
        ...recordSettings
      };
      
      return mergedSettings as WidgetSettings;
    }
    
    // If no record found, return default settings
    console.log('No agent config found, returning default settings');
    return { ...defaultSettings };
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
    console.log(`Updating widget settings for client: ${clientId}`, settings);
    
    // First get the current settings to merge with
    const currentSettings = await getWidgetSettings(clientId);
    
    // Merge with the new settings
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Extract fields that should be stored in separate columns
    const { agent_name, agent_description, logo_url, logo_storage_path } = updatedSettings;
    
    // Check if an agent config record exists in ai_agents
    const { data, error: checkError } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing ai_agent:', checkError);
      throw checkError;
    }
    
    if (data) {
      // Update existing record in ai_agents
      console.log('Updating existing ai_agents record:', data.id);
      const { error } = await supabase
        .from('ai_agents')
        .update({
          name: agent_name,
          agent_description: agent_description,
          logo_url: logo_url,
          logo_storage_path: logo_storage_path,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
      
      if (error) {
        console.error('Error updating ai_agents:', error);
        throw error;
      }
    } else {
      // Create new record if none exists
      console.log('Creating new ai_agents record for client:', clientId);
      const { error } = await supabase
        .from('ai_agents')
        .insert({
          client_id: clientId,
          name: agent_name,
          agent_description: agent_description,
          logo_url: logo_url,
          logo_storage_path: logo_storage_path,
          settings: updatedSettings,
          interaction_type: 'config',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error creating ai_agents record:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error updating widget settings:', error);
    throw error;
  }
}
