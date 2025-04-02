
import { supabase } from '@/integrations/supabase/client';
import { 
  DocumentChunk,
  DocumentProcessingOptions,
  DocumentProcessingResult,
  DocumentProcessingStatus,
  LlamaIndexJobResponse,
  LlamaIndexParsingResult
} from '@/types/document-processing';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';

// Use the Supabase Edge Function as a proxy to avoid CORS issues
const EDGE_FUNCTION_URL = 'https://mgjodiqecnnltsgorife.supabase.co/functions/v1/llama-index-proxy';

// Check if API key is available
if (!LLAMA_CLOUD_API_KEY) {
  console.error('LlamaIndex Cloud API key is not set. Please set VITE_LLAMA_CLOUD_API_KEY in your environment variables.');
}

/**
 * Upload a document to LlamaIndex Cloud for processing
 */
export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: DocumentProcessingOptions = { clientId: '' }
): Promise<LlamaIndexJobResponse> => {
  try {
    console.log('Uploading document to LlamaIndex Cloud via Edge Function:', file.name);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Get the access token for authorization if available
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    // Prepare headers
    const headers: HeadersInit = {
      'x-api-key': LLAMA_CLOUD_API_KEY
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (OPENAI_API_KEY) {
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
    }
    
    console.log('Using authorization header:', headers['Authorization'] ? 'Yes (present)' : 'No');
    
    // Make request to Edge Function which will proxy to LlamaIndex Cloud
    const response = await fetch(`${EDGE_FUNCTION_URL}/process_file`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error uploading to LlamaIndex Cloud:', errorText);
      throw new Error(`Failed to upload document to LlamaIndex: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('LlamaIndex Cloud upload result:', result);
    
    return {
      job_id: result.job_id,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in uploadDocumentToLlamaIndex:', error);
    throw error;
  }
};

/**
 * Poll LlamaIndex for the processing status of a job
 */
export const processLlamaIndexJob = async (jobId: string): Promise<LlamaIndexParsingResult> => {
  try {
    console.log(`Checking status of LlamaIndex job ${jobId}`);
    
    // Get the access token for authorization if available
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    // Prepare headers
    const headers: HeadersInit = {
      'x-api-key': LLAMA_CLOUD_API_KEY,
      'Content-Type': 'application/json'
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (OPENAI_API_KEY) {
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
    }
    
    // Check job status via Edge Function
    const response = await fetch(`${EDGE_FUNCTION_URL}/jobs/${jobId}?includeContent=true`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting LlamaIndex parsing result for job ${jobId}:`, errorText);
      throw new Error(`Failed to get LlamaIndex parsing result: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`LlamaIndex parsing result for job ${jobId}:`, result);
    
    // If job is still processing, wait and retry
    if (result.status !== 'completed' && result.status !== 'failed') {
      console.log(`Job ${jobId} is still processing. Waiting 2 seconds before retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return processLlamaIndexJob(jobId);
    }
    
    // If job completed, check if content was included in the response
    if (result.status === 'completed') {
      if (result.parsed_content) {
        console.log(`Retrieved content for job ${jobId}, length: ${result.parsed_content.length} characters`);
        
        return {
          job_id: jobId,
          status: 'SUCCEEDED',
          parsed_content: result.parsed_content
        };
      }
      
      // If content wasn't included, make another request to get it
      const contentResponse = await fetch(`${EDGE_FUNCTION_URL}/jobs/${jobId}/content`, {
        method: 'GET',
        headers
      });
      
      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        console.error(`Error getting content for job ${jobId}:`, errorText);
        throw new Error(`Failed to get parsed content: ${errorText}`);
      }
      
      const content = await contentResponse.text();
      console.log(`Retrieved content for job ${jobId}, length: ${content.length} characters`);
      
      return {
        job_id: jobId,
        status: 'SUCCEEDED',
        parsed_content: content
      };
    }
    
    // If job failed
    return {
      job_id: jobId,
      status: 'FAILED',
      error: result.error || 'Unknown error during processing'
    };
  } catch (error) {
    console.error(`Error in processLlamaIndexJob for job ${jobId}:`, error);
    throw error;
  }
};

// Convert a file to PDF if it's not already a PDF
export const convertToPdfIfNeeded = async (file: File): Promise<File> => {
  if (file.type === 'application/pdf') {
    return file;
  }
  
  try {
    // For non-PDF files, we won't convert it as LlamaIndex Cloud can handle various file types
    console.log('No conversion needed for LlamaIndex Cloud, supporting multiple file types');
    return file;
  } catch (error) {
    console.error('Error in convertToPdfIfNeeded:', error);
    throw error;
  }
};
