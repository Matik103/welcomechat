
import { supabase } from "@/integrations/supabase/client";

/**
 * Setup a DeepSeek assistant for a client
 */
export const setupDeepSeekAssistant = async (
  clientId: string,
  agentName: string = 'AI Assistant',
  agentDescription: string = '',
  clientName: string = 'Client'
): Promise<{ success: boolean; message?: string; assistant_id?: string }> => {
  try {
    if (!clientId) {
      return { success: false, message: "Client ID is required" };
    }

    // Check if client already has a DeepSeek assistant
    const { data: existingAssistant, error: existingError } = await supabase
      .from('ai_agents')
      .select('deepseek_assistant_id, id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    // If assistant already exists, update it
    if (existingAssistant?.deepseek_assistant_id) {
      console.log("DeepSeek assistant already exists:", existingAssistant.deepseek_assistant_id);
      
      // Update the assistant with new name/description if provided
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({
          agent_name: agentName,
          agent_description: agentDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAssistant.id);
      
      if (updateError) {
        console.error("Error updating DeepSeek assistant:", updateError);
      }
      
      // Also update widget settings to use DeepSeek
      await updateClientWidgetSettings(clientId, {
        agent_name: agentName,
        agent_description: agentDescription,
        deepseek_enabled: true,
        deepseek_assistant_id: existingAssistant.deepseek_assistant_id
      });
      
      return { 
        success: true, 
        message: "DeepSeek assistant updated successfully", 
        assistant_id: existingAssistant.deepseek_assistant_id 
      };
    }

    // Generate unique assistant ID based on client name and timestamp
    const assistantId = `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    
    // Create new assistant record
    const { data: newAssistant, error: insertError } = await supabase
      .from('ai_agents')
      .insert({
        client_id: clientId,
        agent_name: agentName,
        agent_description: agentDescription,
        deepseek_enabled: true,
        deepseek_model: 'deepseek-chat',
        deepseek_assistant_id: assistantId,
        interaction_type: 'config'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating DeepSeek assistant:", insertError);
      return { success: false, message: `Failed to create DeepSeek assistant: ${insertError.message}` };
    }

    // Update client widget settings to use DeepSeek
    await updateClientWidgetSettings(clientId, {
      agent_name: agentName,
      agent_description: agentDescription,
      deepseek_enabled: true,
      deepseek_assistant_id: assistantId
    });

    return { 
      success: true, 
      message: "DeepSeek assistant created successfully",
      assistant_id: assistantId
    };
  } catch (error) {
    console.error("Error in setupDeepSeekAssistant:", error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Update client widget settings
 */
const updateClientWidgetSettings = async (
  clientId: string,
  settings: Record<string, any>
): Promise<boolean> => {
  try {
    // Get current settings
    const { data: currentClient } = await supabase
      .from('clients')
      .select('widget_settings')
      .eq('id', clientId)
      .single();
    
    // Merge with new settings
    const updatedSettings = {
      ...(currentClient?.widget_settings || {}),
      ...settings
    };
    
    // Update settings
    const { error } = await supabase
      .from('clients')
      .update({
        widget_settings: updatedSettings
      })
      .eq('id', clientId);
    
    if (error) {
      console.error("Error updating widget settings:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateClientWidgetSettings:", error);
    return false;
  }
};
