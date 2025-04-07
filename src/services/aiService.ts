
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
    const timeoutMs = 45000; // 45 seconds
    let timeoutId: number | null = null;
    
    // Create a promise that will reject after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Request timed out"));
      }, timeoutMs);
    });
    
    // Sanitize the input query
    const sanitizedQuery = sanitizeForXSS(query);
    
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
    const { data, error } = await Promise.race([
      requestPromise,
      timeoutPromise.catch(err => {
        throw err;
      })
    ]) as { data: any, error: any };
    
    // Clear the timeout if it hasn't fired yet
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    if (error) {
      console.error('Error calling DeepSeek edge function:', error);
      return { 
        error: `Failed to send a request to the AI service: ${error.message}` 
      };
    }
    
    if (!data) {
      console.error('No data returned from DeepSeek edge function');
      return { 
        error: 'No response received from the AI service' 
      };
    }
    
    console.log('Response from DeepSeek edge function:', {
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
    
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
