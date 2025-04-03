import { supabase } from '@/integrations/supabase/client';
import { 
  DocumentChunk,
  DocumentProcessingOptions,
  DocumentProcessingResult,
  DocumentProcessingStatus,
  LlamaIndexJobResponse,
  LlamaIndexParsingResult
} from '@/types/document-processing';
import { LLAMA_CLOUD_API_KEY } from '@/config/env';

// Supabase Edge Function URL
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llama-index-proxy`;

/**
 * Upload a document to LlamaIndex Cloud for processing via Edge Function
 */
export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: DocumentProcessingOptions = { clientId: '' }
): Promise<LlamaIndexJobResponse> => {
  try {
    console.log('Uploading document to LlamaIndex via Edge Function:', file.name);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Get the Supabase auth token
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    if (!authToken) {
      throw new Error('No authentication token available');
    }
    
    // Call the Edge Function
    const response = await fetch(`${EDGE_FUNCTION_URL}/process_file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error uploading to LlamaIndex:', errorText);
      throw new Error(`Failed to upload document to LlamaIndex: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('LlamaIndex upload result:', result);
    
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
 * Poll LlamaIndex for the processing status of a job via Edge Function
 */
export const processLlamaIndexJob = async (jobId: string): Promise<LlamaIndexParsingResult> => {
  try {
    console.log(`Checking status of LlamaIndex job ${jobId} via Edge Function`);
    
    // Get the Supabase auth token
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    if (!authToken) {
      throw new Error('No authentication token available');
    }
    
    // Check job status with content included if completed
    const response = await fetch(`${EDGE_FUNCTION_URL}/jobs/${jobId}?includeContent=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
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
    
    // If job completed successfully
    if (result.status === 'completed') {
      return {
        job_id: jobId,
        status: 'SUCCEEDED',
        parsed_content: result.parsed_content
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
