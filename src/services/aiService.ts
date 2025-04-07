
import { supabase } from '@/integrations/supabase/client';
import { sanitizeForXSS } from '@/utils/inputSanitizer';
import { toast } from 'sonner';
import { DEEPSEEK_MODEL } from '@/config/env';

/**
 * Send a query to DeepSeek via Supabase Edge Function
 * @param clientId - The client ID
 * @param query - The user query
 * @returns The response with answer or error
 */
export const sendQueryToDeepSeek = async (
  clientId: string,
  query: string
): Promise<{
  answer?: string;
  error?: string;
  processingTimeMs?: number;
}> => {
  try {
    console.log(`Sending query to DeepSeek for client ${clientId}`);
    
    // Add request timestamp for tracking
    const timestamp = new Date().toISOString();
    
    // Set up a timeout for the edge function call
    const timeoutMs = 60000; // Increase timeout to 60 seconds
    let timeoutId: number | null = null;
    
    // Create a promise that will reject after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Request timed out"));
      }, timeoutMs);
    });
    
    // Sanitize the input query
    const sanitizedQuery = sanitizeForXSS(query);
    
    console.log("Preparing DeepSeek request with payload:", {
      client_id: clientId,
      query: sanitizedQuery.length,
      model: DEEPSEEK_MODEL || 'deepseek-chat',
      timestamp
    });
    
    // Create the actual request promise
    const requestPromise = supabase.functions.invoke('query-deepseek', {
      body: {
        client_id: clientId,
        query: sanitizedQuery,
        model: DEEPSEEK_MODEL || 'deepseek-chat',
        timestamp
      }
    });
    
    // Race between the timeout and the actual request
    const result = await Promise.race([
      requestPromise,
      timeoutPromise
    ]);
    
    // Clear the timeout if it hasn't fired yet
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    // If we got undefined or null result
    if (!result) {
      console.error('No result received from DeepSeek edge function');
      return { 
        error: 'No response received from the AI service' 
      };
    }
    
    const { data, error } = result as { data: any, error: any };
    
    if (error) {
      console.error('Error calling DeepSeek edge function:', error);
      return { 
        error: `Failed to send a request to the AI service: ${error.message || 'Unknown error'}` 
      };
    }
    
    if (!data) {
      console.error('No data returned from DeepSeek edge function');
      return { 
        error: 'No response received from the AI service' 
      };
    }
    
    console.log('Response received from DeepSeek edge function:', {
      hasAnswer: !!data.answer,
      answerLength: data.answer?.length || 0,
      hasError: !!data.error,
      processingTimeMs: data.processing_time_ms
    });
    
    if (data.error) {
      return {
        answer: data.answer, // May still have a fallback answer even with error
        error: data.error
      };
    }
    
    return {
      answer: data.answer,
      processingTimeMs: data.processing_time_ms
    };
  } catch (error: any) {
    console.error('Exception in sendQueryToDeepSeek:', error);
    
    // Special handling for timeout errors
    if (error.message === "Request timed out") {
      return {
        error: 'The request timed out. The service might be busy or experiencing issues.'
      };
    }
    
    // Enhanced error message for network issues
    if (error.message && error.message.includes('Failed to fetch') || 
        error.message && error.message.includes('NetworkError')) {
      return {
        error: 'Network error: Unable to connect to the AI service. Please check your internet connection and try again.'
      };
    }
    
    return {
      error: error instanceof Error ? error.message : 'Unknown error in AI service'
    };
  }
};
