
import { supabase } from '@/integrations/supabase/client';
import { 
  LlamaIndexJobResponse, 
  LlamaIndexParsingResult, 
  LlamaIndexProcessingOptions 
} from '@/types/document-processing';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';

// Base URL for our Supabase Edge Function that proxies requests to LlamaIndex
const SUPABASE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llama-index-proxy`
  : 'https://mgjodiqecnnltsgorife.supabase.co/functions/v1/llama-index-proxy';

// Upload a document to LlamaIndex for processing
export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: LlamaIndexProcessingOptions = {}
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
    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (OPENAI_API_KEY) {
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`;
    }
    
    console.log('Using authorization header:', headers['Authorization'] ? 'Yes (present)' : 'No');
    
    // Use our Supabase Edge Function as a proxy to avoid CORS issues
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/process_file`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error uploading to LlamaIndex Cloud:', errorText);
      throw new Error(`Failed to upload document to LlamaIndex: ${errorText}`);
    }
    
    const result: LlamaIndexJobResponse = await response.json();
    console.log('LlamaIndex Cloud upload result:', result);
    return result;
  } catch (error) {
    console.error('Error in uploadDocumentToLlamaIndex:', error);
    throw error;
  }
};

// Poll LlamaIndex for the processing status of a job
export const processLlamaIndexJob = async (jobId: string): Promise<LlamaIndexParsingResult> => {
  try {
    console.log(`Checking status of LlamaIndex job ${jobId}`);
    
    // Get the access token for authorization if available
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    // Prepare headers
    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/jobs/${jobId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting LlamaIndex parsing result for job ${jobId}:`, errorText);
      throw new Error(`Failed to get LlamaIndex parsing result: ${errorText}`);
    }
    
    const result: LlamaIndexParsingResult = await response.json();
    console.log(`LlamaIndex parsing result for job ${jobId}:`, result);
    
    // If the job is still processing, wait and then retry
    if (result.status !== 'SUCCEEDED' && result.status !== 'FAILED') {
      console.log(`Job ${jobId} is still processing. Waiting 2 seconds before retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return processLlamaIndexJob(jobId);
    }
    
    return result;
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
