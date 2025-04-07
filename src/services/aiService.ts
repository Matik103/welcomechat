import { supabase } from '@/integrations/supabase/client';
import { DEEPSEEK_MODEL } from '@/config/env';
import { createDeepSeekAssistant, updateDeepSeekAssistant } from '@/utils/deepseekUtils';

/**
 * Send a query to DeepSeek via Supabase Edge Function
 */
export const sendQueryToDeepSeek = async (
  clientId: string,
  query: string,
  model: string = DEEPSEEK_MODEL || 'deepseek-chat'
) => {
  try {
    console.log(`Sending query to DeepSeek for client ${clientId}`);
    
    // Get the assistant ID for this client
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .select('deepseek_assistant_id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (agentError || !agentData?.deepseek_assistant_id) {
      console.error('No DeepSeek assistant found for client:', clientId);
      throw new Error('No DeepSeek assistant configured for this client');
    }

    // Set up a timeout for the edge function call
    const timeoutMs = 60000; // 60 second timeout
    let timeoutId: number | null = null;
    
    // Create a promise that will reject after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Request timed out"));
      }, timeoutMs);
    });

    // Create the actual request promise
    const requestPromise = supabase.functions.invoke('query-deepseek', {
      body: {
        client_id: clientId,
        query,
        model,
        assistant_id: agentData.deepseek_assistant_id,
        timestamp: new Date().toISOString()
      }
    });

    // Race between the timeout and the actual request
    const result = await Promise.race([requestPromise, timeoutPromise]);

    // Clear the timeout if it hasn't fired yet
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    if (!result || !result.data) {
      console.error('No data returned from DeepSeek edge function');
      throw new Error('No response from AI service');
    }

    console.log('Response from DeepSeek edge function:', {
      clientId,
      queryLength: query.length,
      responseLength: result.data.answer?.length || 0,
      processingTimeMs: result.data.processing_time_ms
    });

    return result.data;
  } catch (error) {
    console.error('Exception in sendQueryToDeepSeek:', error);
    
    // Enhanced error message for network issues
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError'))) {
      throw new Error('Network error: Unable to connect to the AI service. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

/**
 * Create or update a DeepSeek assistant for a client
 */
export const setupDeepSeekAssistant = async (
  clientId: string,
  agentName: string,
  agentDescription: string,
  clientName: string
) => {
  try {
    // Check if an assistant already exists
    const { data: existingAgent } = await supabase
      .from('ai_agents')
      .select('deepseek_assistant_id')
      .eq('client_id', clientId)
      .eq('interaction_type', 'config')
      .single();

    if (existingAgent?.deepseek_assistant_id) {
      // Update existing assistant
      return await updateDeepSeekAssistant(clientId, agentName, agentDescription);
    } else {
      // Create new assistant
      return await createDeepSeekAssistant(clientId, agentName, agentDescription, clientName);
    }
  } catch (error) {
    console.error('Error in setupDeepSeekAssistant:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to set up DeepSeek assistant'
    };
  }
};
