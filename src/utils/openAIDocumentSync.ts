
import { supabase } from '@/integrations/supabase/client';
import { sanitizeForXSS } from '@/utils/inputSanitizer';
import { toast } from 'sonner';
import { sendQueryToDeepSeek } from '@/services/aiService';

/**
 * Get an answer from the AI service
 */
export const getAnswerFromOpenAIAssistant = async (
  clientId: string,
  query: string
): Promise<{
  answer?: string;
  error?: string;
}> => {
  try {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    if (!query) {
      throw new Error('Query is required');
    }

    // Sanitize the input query
    const sanitizedQuery = sanitizeForXSS(query);
    
    console.log(`Sending query to AI service for client ${clientId}`);
    
    // Use the DeepSeek service instead of OpenAI
    const result = await sendQueryToDeepSeek(clientId, sanitizedQuery);
    
    if (result.error) {
      console.error(`Error from AI service: ${result.error}`);
      return {
        error: result.error
      };
    }

    if (!result.answer) {
      return {
        error: 'No answer received from AI service'
      };
    }

    return {
      answer: result.answer
    };
  } catch (error) {
    console.error('Error in getAnswerFromOpenAIAssistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      error: `Failed to get answer: ${errorMessage}`
    };
  }
};
