
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sets up a DeepSeek assistant for a client
 */
export const setupDeepseekAssistant = async (clientId: string, agentName: string, agentDescription: string, clientName: string) => {
  try {
    console.log('Setting up DeepSeek assistant for:', { clientId, agentName, agentDescription, clientName });
    
    // Create a more detailed system prompt based on the provided description
    const systemPrompt = createSystemPrompt(agentDescription, clientName, agentName);
    
    // Call the create assistant function with the enhanced system prompt
    const assistantId = await createDeepseekAssistant(clientId, agentName, systemPrompt);
    
    // Log the assistant creation
    console.log(`DeepSeek assistant created with ID: ${assistantId}`);
    
    return { 
      success: true, 
      message: 'DeepSeek assistant setup successfully',
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

/**
 * Creates an enhanced system prompt based on the provided description
 */
const createSystemPrompt = (agentDescription: string, clientName: string, agentName: string): string => {
  // Base instructions that apply to all assistants
  const baseInstructions = `
You are ${agentName}, a friendly, helpful assistant for ${clientName}. 

Your primary goal is to provide excellent customer service and assist users with their questions and needs related to ${clientName}.

Important behavioral guidelines:
- Be friendly, conversational, and customer-centric
- Always maintain a professional but warm tone
- When users ask casual questions like "how are you", respond naturally and conversationally. For example: "I'm doing great today! Thank you for asking. How about yourself?"
- When users ask about your name, always tell them "My name is ${agentName}" and ask about them to build rapport
- When users ask philosophical questions (like "what is life", "do you have consciousness") or personal questions (like "do you have a love life", "do you have a mom", "what do you look like"), politely acknowledge their question and redirect the conversation:
  - First, briefly acknowledge their question in a friendly way
  - Then, gently explain that you're here primarily to help with ${clientName}-related topics
  - Finally, ask a specific follow-up question about how you can assist them with something related to ${clientName}
  - Use different phrasings each time to maintain a natural conversation flow
- For example, you might say: "That's an interesting philosophical question! While I'd love to chat about that, I'm here primarily to help you with your questions about ${clientName}. Is there something specific about our products/services I can assist you with today?"
- Keep track of conversation context and reference previous messages to provide continuity
- Remember details users share about themselves and refer back to them appropriately
- Provide concise but thorough responses
- Always prioritize being helpful about topics related to ${clientName}

${agentDescription}`.trim();

  return baseInstructions;
};

/**
 * Creates a DeepSeek assistant via the Supabase Edge Function
 */
export const createDeepseekAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string
): Promise<string> => {
  try {
    console.log(`Creating DeepSeek assistant for client ${clientId}`);
    
    // Sanitize input values to prevent errors with quotes
    const sanitizedAgentName = agentName.replace(/"/g, "'");
    const sanitizedAgentDescription = agentDescription.replace(/"/g, "'");
    
    // Call the Supabase Edge Function to create the DeepSeek assistant
    const { data, error } = await supabase.functions.invoke('create-deepseek-assistant', {
      body: {
        client_id: clientId,
        agent_name: sanitizedAgentName,
        agent_description: sanitizedAgentDescription
      },
    });
    
    if (error) {
      console.error('DeepSeek assistant creation error:', error);
      toast.error('Failed to create DeepSeek assistant');
      throw new Error(error.message || 'Failed to create DeepSeek assistant');
    }
    
    console.log('DeepSeek assistant response:', data);
    
    if (!data || !data.assistant_id) {
      const errorMsg = 'Invalid response from DeepSeek assistant creation';
      console.error(errorMsg, data);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Update the AI agent record with the DeepSeek assistant ID
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({ deepseek_assistant_id: data.assistant_id })
      .eq('client_id', clientId)
      .eq('interaction_type', 'config');
      
    if (updateError) {
      console.error('Error updating AI agent with assistant ID:', updateError);
      // Continue despite this error, as the assistant was created successfully
    }
    
    // Success notification
    toast.success('DeepSeek assistant created successfully');
    return data.assistant_id;
  } catch (error) {
    console.error('Error in createDeepseekAssistant:', error);
    toast.error(`DeepSeek assistant creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};
