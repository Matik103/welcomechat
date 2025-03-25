
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/client-form';
import { toast } from 'sonner';
import { createClientActivity } from './clientActivityService';

export async function getWidgetSettings(clientId: string): Promise<WidgetSettings> {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('settings')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (error) {
      console.error('Error fetching widget settings:', error);
      throw error;
    }

    // Ensure we return a proper WidgetSettings object by extracting needed fields
    const settings = data?.settings as Record<string, any> || {};
    
    return {
      agent_name: settings.agent_name || '',
      agent_description: settings.agent_description || '',
      logo_url: settings.logo_url || '',
      logo_storage_path: settings.logo_storage_path || '',
    };
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    return {
      agent_name: '',
      agent_description: '',
      logo_url: '',
      logo_storage_path: '',
    };
  }
}

export async function updateWidgetSettings(
  clientId: string,
  settings: WidgetSettings
): Promise<WidgetSettings> {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .update({ settings })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .select('settings')
      .single();

    if (error) {
      console.error('Error updating widget settings:', error);
      throw error;
    }

    // Log the activity
    await createClientActivity(
      clientId,
      'widget_settings_updated',
      'Updated widget settings',
      { settings }
    );

    toast.success('Widget settings updated successfully');
    
    // Ensure we return a proper WidgetSettings object
    const updatedSettings = data?.settings as Record<string, any> || settings;
    
    return {
      agent_name: updatedSettings.agent_name || '',
      agent_description: updatedSettings.agent_description || '',
      logo_url: updatedSettings.logo_url || '',
      logo_storage_path: updatedSettings.logo_storage_path || '',
    };
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    toast.error(`Failed to update widget settings: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
