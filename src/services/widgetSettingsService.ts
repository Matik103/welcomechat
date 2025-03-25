
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

    return data?.settings as WidgetSettings || {};
  } catch (error) {
    console.error('Error in getWidgetSettings:', error);
    return {};
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
    return data?.settings as WidgetSettings || settings;
  } catch (error) {
    console.error('Error in updateWidgetSettings:', error);
    toast.error(`Failed to update widget settings: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
