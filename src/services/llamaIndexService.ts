
import { supabase } from '@/integrations/supabase/client';
import { 
  DocumentChunk,
  DocumentProcessingOptions,
  DocumentProcessingResult,
  DocumentProcessingStatus,
  LlamaIndexJobResponse,
  LlamaIndexParsingResult,
  Json
} from '@/types/document-processing';
import { LLAMA_CLOUD_API_KEY } from '@/config/env';
import { convertToPdf } from '@/utils/fileConverter';
import { fetchSecrets } from './secretsService';

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llama-index-proxy`;
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv'
];

// Cache for API keys to avoid redundant requests
let cachedApiKeys: {
  llamaCloudApiKey?: string;
  openaiApiKey?: string;
  timestamp?: number;
} = {};

/**
 * Get API keys with caching
 */
export const getApiKeys = async (): Promise<{ llamaCloudApiKey?: string; openaiApiKey?: string }> => {
  try {
    // Check if we have cached keys that are less than 5 minutes old
    const now = Date.now();
    if (cachedApiKeys.timestamp && now - cachedApiKeys.timestamp < 5 * 60 * 1000) {
      return {
        llamaCloudApiKey: cachedApiKeys.llamaCloudApiKey,
        openaiApiKey: cachedApiKeys.openaiApiKey
      };
    }
    
    // First try environment variables
    let llamaCloudApiKey = LLAMA_CLOUD_API_KEY;
    let openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // If not available, try to fetch from Supabase secrets
    if (!llamaCloudApiKey || !openaiApiKey) {
      const secrets = await fetchSecrets(['LLAMA_CLOUD_API_KEY', 'OPENAI_API_KEY']);
      
      if (!llamaCloudApiKey && secrets.LLAMA_CLOUD_API_KEY) {
        llamaCloudApiKey = secrets.LLAMA_CLOUD_API_KEY;
      }
      
      if (!openaiApiKey && secrets.OPENAI_API_KEY) {
        openaiApiKey = secrets.OPENAI_API_KEY;
      }
    }
    
    // Cache the results
    cachedApiKeys = {
      llamaCloudApiKey,
      openaiApiKey,
      timestamp: now
    };
    
    return { llamaCloudApiKey, openaiApiKey };
  } catch (error) {
    console.error('Error getting API keys:', error);
    return {};
  }
};

/**
 * Check if LlamaIndex is properly configured
 */
export const isLlamaIndexConfigured = async (): Promise<boolean> => {
  const { llamaCloudApiKey, openaiApiKey } = await getApiKeys();
  return Boolean(llamaCloudApiKey && openaiApiKey);
};

/**
 * Validate file before upload
 */
const validateFile = (file: File): void => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not supported. Supported types: PDF, DOCX, TXT, CSV`);
  }
};

/**
 * Upload a document to LlamaIndex Cloud for processing via Edge Function
 */
export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: DocumentProcessingOptions = { clientId: '' }
): Promise<LlamaIndexJobResponse> => {
  try {
    console.log('Uploading document to LlamaIndex via Edge Function:', file.name);
    
    // Check if API keys are configured
    const isConfigured = await isLlamaIndexConfigured();
    if (!isConfigured) {
      throw new Error('LlamaIndex or OpenAI API keys are not configured. Please set them in your environment variables or Supabase secrets.');
    }
    
    // Validate file
    validateFile(file);
    
    // Convert file to PDF if needed
    console.log('Converting file to PDF if needed...');
    const pdfFile = await convertToPdf(file);
    console.log('File conversion complete:', pdfFile.name);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', pdfFile);
    
    // Get the Supabase auth token
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    if (!authToken) {
      throw new Error('No authentication token available. Please sign in.');
    }
    
    // Call the Edge Function
    const response = await fetch(`${EDGE_FUNCTION_URL}/process_file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });
    
    // Clone the response before reading it
    const responseClone = response.clone();
    
    try {
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to upload document (status: ${response.status})`);
      }
      
      if (!result.job_id) {
        throw new Error('No job ID received from LlamaIndex');
      }
      
      return {
        job_id: result.job_id,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (parseError) {
      // If JSON parsing fails, try to get the error message from the cloned response
      const errorText = await responseClone.text();
      console.error('Failed to parse response:', errorText);
      console.error('JSON parsing error:', parseError);
      throw new Error(`Failed to process document: ${errorText || (parseError instanceof Error ? parseError.message : String(parseError))}`);
    }
  } catch (error) {
    console.error('Error in uploadDocumentToLlamaIndex:', error);
    throw error;
  }
};

/**
 * Poll LlamaIndex for the processing status of a job via Edge Function
 */
export const processLlamaIndexJob = async (
  jobId: string, 
  attempt: number = 1,
  startTime: number = Date.now()
): Promise<LlamaIndexParsingResult> => {
  try {
    // Maximum number of retry attempts
    const MAX_RETRIES = 30; // 30 attempts
    // Maximum total time to wait (5 minutes)
    const MAX_WAIT_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
    // Base delay for exponential backoff (starts at 2 seconds)
    const BASE_DELAY = 2000;
    // Maximum delay between retries (30 seconds)
    const MAX_DELAY = 30000;

    console.log(`Checking status of LlamaIndex job ${jobId} via Edge Function (attempt ${attempt})`);
    
    // Check if we've exceeded the maximum wait time
    if (Date.now() - startTime > MAX_WAIT_TIME) {
      throw new Error(`Job processing timed out after ${MAX_WAIT_TIME / 1000} seconds`);
    }

    // Check if we've exceeded the maximum number of retries
    if (attempt > MAX_RETRIES) {
      throw new Error(`Exceeded maximum number of retry attempts (${MAX_RETRIES})`);
    }
    
    // Get the Supabase auth token
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    if (!authToken) {
      throw new Error('No authentication token available. Please sign in.');
    }
    
    // Check job status with content included if completed
    const response = await fetch(`${EDGE_FUNCTION_URL}/jobs/${jobId}?includeContent=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to get job status (status: ${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        const textContent = await response.text();
        if (textContent.includes('<!DOCTYPE')) {
          errorMessage = 'Received HTML response instead of JSON. The service may be unavailable or misconfigured.';
        } else {
          errorMessage = textContent || errorMessage;
        }
      }
      throw new Error(`Failed to get LlamaIndex parsing result: ${errorMessage}`);
    }
    
    // Parse response as JSON
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      const textContent = await response.text();
      console.error('Failed to parse response as JSON:', textContent);
      throw new Error('Invalid response format from LlamaIndex job status service');
    }
    
    console.log(`LlamaIndex parsing result for job ${jobId}:`, result);
    
    // If job is still processing, wait and retry with exponential backoff
    if (result.status !== 'completed' && result.status !== 'failed' && 
        result.status !== 'SUCCEEDED' && result.status !== 'FAILED') {
      // Calculate delay with exponential backoff: 2s, 4s, 8s, 16s, etc.
      const delay = Math.min(BASE_DELAY * Math.pow(2, attempt - 1), MAX_DELAY);
      console.log(`Job ${jobId} is still processing. Waiting ${delay/1000} seconds before retry ${attempt}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return processLlamaIndexJob(jobId, attempt + 1, startTime);
    }
    
    // If job completed successfully
    if (result.status === 'completed' || result.status === 'SUCCEEDED') {
      if (!result.parsed_content) {
        throw new Error('No content received from LlamaIndex');
      }
      
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

// Convert a file to PDF if needed
export const convertToPdfIfNeeded = async (file: File): Promise<File> => {
  if (file.type === 'application/pdf') {
    return file;
  }
  
  try {
    return await convertToPdf(file);
  } catch (error) {
    console.error('Error in convertToPdfIfNeeded:', error);
    throw error;
  }
};
