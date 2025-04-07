import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';
import { WidgetSettings, defaultSettings } from '../types/widget-settings';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class WidgetSettingsService {
  static async getWidgetSettings(clientId: string): Promise<WidgetSettings> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) {
        console.error('Error fetching widget settings:', error);
        return {
          ...defaultSettings,
          clientId,
          deepseek_enabled: true,
          deepseek_model: 'deepseek-chat',
          openai_enabled: false,
          openai_model: '',
          openai_assistant_id: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return {
        ...defaultSettings,
        ...data,
        clientId: data.client_id,
        deepseek_enabled: data.deepseek_enabled ?? true,
        deepseek_model: data.deepseek_model ?? 'deepseek-chat',
        openai_enabled: data.openai_enabled ?? false,
        openai_model: data.openai_model ?? '',
        openai_assistant_id: data.openai_assistant_id ?? '',
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getWidgetSettings:', error);
      return {
        ...defaultSettings,
        clientId,
        deepseek_enabled: true,
        deepseek_model: 'deepseek-chat',
        openai_enabled: false,
        openai_model: '',
        openai_assistant_id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  static async updateWidgetSettings(clientId: string, settings: Partial<WidgetSettings>): Promise<WidgetSettings> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .upsert({
          client_id: clientId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        ...defaultSettings,
        ...data,
        clientId: data.client_id
      };
    } catch (error) {
      console.error('Error in updateWidgetSettings:', error);
      throw error;
    }
  }
}
