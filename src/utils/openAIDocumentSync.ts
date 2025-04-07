
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
    let timeoutId: number | null = null;
    
    // Create a promise that will reject after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Request timed out"));
      }, timeoutMs);
    });
    
    // Create the actual request promise
    const requestPromise = supabase.functions.invoke('query-openai-assistant', {
      body: {
        client_id: clientId,
        query: sanitizeInput(query),
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
    
    // Validate file before attempting upload
    if (!file || !file.name) {
      return {
        success: false,
        message: 'Invalid file provided'
      };
    }
    
    // Validate file size (limit to 20MB)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: `File size exceeds maximum limit of 20MB`
      };
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: `Unsupported file type: ${file.type}. Allowed types: PDF, TXT, DOC, DOCX`
      };
    }
    
    // Convert file to base64
    const fileData = await readFileAsBase64(file);
    
    // Set up timeout for upload
    const timeoutMs = 60000; // 60 seconds for upload
    let timeoutId: number | null = null;
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Upload timed out"));
      }, timeoutMs);
    });
    
    // Make the actual request
    const requestPromise = supabase.functions.invoke('upload-file-to-openai', {
      body: {
        client_id: sanitizeInput(clientId),
        assistant_id: sanitizeInput(assistantId),
        file_data: fileData,
        file_type: file.type,
        file_name: file.name
      }
    });
    
    // Race the two promises
    const { data, error } = await Promise.race([
      requestPromise,
      timeoutPromise.catch(err => {
        throw err;
      })
    ]) as { data: any, error: any };
    
    // Clear timeout if it hasn't fired
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
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
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === "Upload timed out") {
      return {
        success: false,
        message: 'The upload timed out. The file may be too large or the service might be busy.'
      };
    }
    
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
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Basic sanitization to prevent injection attacks
  return input
    .replace(/<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g, '') // Remove HTML tags except <b>, <i>
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, 'data-safe:');
}
