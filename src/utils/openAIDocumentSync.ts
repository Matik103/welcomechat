import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Get an answer from OpenAI assistant via Supabase Edge Function
 * @param clientId - The client ID
 * @param query - The user query
 * @returns The response with answer or error
 */
export const getAnswerFromOpenAIAssistant = async (
  clientId: string,
  query: string
): Promise<{
  answer?: string;
  error?: string;
  documents?: any[];
  processing_time_ms?: number;
}> => {
  try {
    console.log(`Sending query to OpenAI assistant for client ${clientId}`);
    
    // Add request timestamp for tracking
    const timestamp = new Date().toISOString();
    
    // Set up a timeout for the edge function call
    const timeoutMs = 45000; // 45 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Call the edge function with the abort signal
    const { data, error } = await supabase.functions.invoke('query-openai-assistant', {
      body: {
        client_id: clientId,
        query,
        timestamp
      },
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('Error calling OpenAI assistant edge function:', error);
      return { 
        error: `Failed to send a request to the Edge Function: ${error.message}` 
      };
    }
    
    if (!data) {
      console.error('No data returned from OpenAI assistant edge function');
      return { 
        error: 'No response received from the AI service' 
      };
    }
    
    console.log('Response from OpenAI assistant edge function:', {
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
      documents: data.documents,
      processing_time_ms: data.processing_time_ms
    };
  } catch (error: any) {
    console.error('Exception in getAnswerFromOpenAIAssistant:', error);
    
    // Special handling for timeout errors
    if (error.name === 'AbortError') {
      return {
        error: 'The request timed out. The service might be busy or experiencing issues.'
      };
    }
    
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Upload file to OpenAI assistant via Supabase Edge Function
 */
export const uploadFileToOpenAIAssistant = async (
  clientId: string,
  assistantId: string,
  file: File
): Promise<{
  success: boolean;
  message: string;
  document_id?: string;
  openai_file_id?: string;
}> => {
  try {
    console.log(`Uploading file to OpenAI assistant for client ${clientId}`);
    
    // Convert file to base64
    const fileData = await readFileAsBase64(file);
    
    const { data, error } = await supabase.functions.invoke('upload-file-to-openai', {
      body: {
        client_id: clientId,
        assistant_id: assistantId,
        file_data: fileData,
        file_type: file.type,
        file_name: file.name
      }
    });
    
    if (error) {
      console.error('Error calling upload-file-to-openai function:', error);
      return { 
        success: false,
        message: `Failed to upload: ${error.message}` 
      };
    }
    
    if (!data || data.error) {
      const errorMessage = data?.error || 'Unknown error';
      console.error('Error from upload-file-to-openai function:', errorMessage);
      return { 
        success: false,
        message: `Upload failed: ${errorMessage}`
      };
    }
    
    console.log('File uploaded successfully:', data);
    
    return {
      success: true,
      message: data.message || 'File uploaded successfully',
      document_id: data.document?.id,
      openai_file_id: data.document?.openai_file_id
    };
  } catch (error) {
    console.error('Exception in uploadFileToOpenAIAssistant:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during upload'
    };
  }
};

/**
 * Helper function to read file as base64
 */
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let result = reader.result as string;
      // Remove the data URL prefix
      if (result.includes('base64,')) {
        result = result.split('base64,')[1];
      }
      resolve(result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Sync document with OpenAI assistant via Supabase Edge Function
 * @param documentId - The document ID
 * @param clientId - The client ID
 * @returns The response with success or error
 */
export const syncDocumentWithOpenAI = async (documentId: string, clientId: string) => {
  try {
    console.log(`Syncing document with OpenAI assistant for client ${clientId}`);
    
    const { data, error } = await supabase.functions.invoke('upload-file-to-openai', {
      body: { file_id: documentId, client_id: clientId }
    });
    
    if (error) {
      console.error('Error calling upload-file-to-openai function:', error);
      return { 
        success: false,
        message: `Failed to sync: ${error.message}` 
      };
    }
    
    if (!data || data.error) {
      const errorMessage = data?.error || 'Unknown error';
      console.error('Error from upload-file-to-openai function:', errorMessage);
      return { 
        success: false,
        message: `Sync failed: ${errorMessage}`
      };
    }
    
    console.log('Document synced successfully:', data);
    
    return {
      success: true,
      message: data.message || 'Document synced successfully'
    };
  } catch (error) {
    console.error('Exception in syncDocumentWithOpenAI:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during sync'
    };
  }
};
