
import { supabase } from "@/integrations/supabase/client";
import { DEEPSEEK_MODEL } from "@/config/env";

/**
 * Sets up a DeepSeek AI assistant for a client
 */
export const setupDeepSeekAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string,
  clientName: string
) => {
  try {
    console.log('Setting up DeepSeek assistant for:', { clientId, agentName, agentDescription, clientName });
    
    // Generate a unique assistant ID based on client name and timestamp
    const assistantId = `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    
    // Check if an AI agent already exists for this client
    const { data: existingAgent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error checking for existing agent:', fetchError);
      throw fetchError;
    }
    
    if (existingAgent) {
      // Update the existing agent
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({
          agent_name: agentName,
          agent_description: agentDescription,
          deepseek_enabled: true,
          deepseek_model: DEEPSEEK_MODEL || 'deepseek-chat',
          deepseek_assistant_id: assistantId,
          openai_enabled: false,
          openai_assistant_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAgent.id);
        
      if (updateError) {
        console.error('Error updating AI agent:', updateError);
        throw updateError;
      }
    } else {
      // Create a new agent
      const { error: insertError } = await supabase
        .from('ai_agents')
        .insert({
          client_id: clientId,
          name: agentName,
          agent_name: agentName,
          agent_description: agentDescription,
          client_name: clientName,
          deepseek_enabled: true,
          deepseek_model: DEEPSEEK_MODEL || 'deepseek-chat',
          deepseek_assistant_id: assistantId,
          interaction_type: 'config',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating AI agent:', insertError);
        throw insertError;
      }
    }
    
    console.log(`DeepSeek assistant ${assistantId} configured successfully for client ${clientId}`);
    
    return { 
      success: true, 
      message: 'DeepSeek assistant configured successfully',
      assistantId
    };
  } catch (error) {
    console.error('Error setting up DeepSeek assistant:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to set up DeepSeek assistant'
    };
  }
};
