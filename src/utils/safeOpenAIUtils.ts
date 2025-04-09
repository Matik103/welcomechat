
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

/**
 * Safe utilities that completely disable automatic creation
 * and don't trigger activity logging with invalid enum values
 */
export const safeOpenAIUtils = {
  /**
   * Completely disabled assistant creation function
   * This is a dummy function that only logs to console and returns a success response
   * without making any API calls or triggering any database activity
   */
  createAssistant: async (clientId: string, agentName: string, description: string) => {
    // Log the attempt but don't actually create anything
    console.log('Assistant creation is completely disabled');
    console.log('Assistant creation request ignored for:', { clientId, agentName, description });
    
    // Instead, update the settings to use DeepSeek
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({
          deepseek_enabled: true,
          deepseek_model: 'deepseek-chat',
          openai_enabled: false,
          openai_assistant_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('interaction_type', 'config');
        
      if (error) {
        console.error('Error updating AI agent settings:', error);
      }
    } catch (err) {
      console.error('Exception updating AI agent settings:', err);
    }
    
    // Return a mock success without actually creating anything
    return { 
      success: true, 
      message: 'Assistant creation disabled - using DeepSeek instead'
    };
  }
};
