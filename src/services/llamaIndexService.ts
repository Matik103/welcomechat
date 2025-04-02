
import { supabase } from '@/integrations/supabase/client';
import { 
  DocumentChunk,
  DocumentProcessingOptions,
  DocumentProcessingResult,
  DocumentProcessingStatus,
  LlamaIndexParsingResult,
  LlamaIndexJobResponse
} from '@/types/document-processing';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';

// Base URL for the LlamaIndex Cloud API
const API_URL = 'https://api.cloud.llamaindex.ai/api/parsing';

// Check if API key is available
if (!LLAMA_CLOUD_API_KEY) {
  console.error('LlamaIndex Cloud API key is not set. Please set VITE_LLAMA_CLOUD_API_KEY in your environment variables.');
}

/**
 * Upload a document to LlamaIndex Cloud for processing
 */
export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: DocumentProcessingOptions = {}
): Promise<LlamaIndexJobResponse> => {
  try {
    console.log('Uploading document to LlamaIndex Cloud:', file.name);
    
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
    
    // Make direct API request to LlamaIndex Cloud
    const response = await fetch(`${API_URL}/upload`, {
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
    
    // Check job status
    const response = await fetch(`${API_URL}/job/${jobId}`, {
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
    
    // If job completed, fetch the content
    if (result.status === 'completed') {
      const contentResponse = await fetch(`${API_URL}/job/${jobId}/result/markdown`, {
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
