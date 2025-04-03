
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

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llama-index-proxy`;
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv'
];

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
    
    if (!response.ok) {
      let errorMessage = 'Failed to upload document';
      try {
        // Try to parse response as JSON
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        // If can't parse as JSON, get text content
        const textContent = await response.text();
        if (textContent.includes('<!DOCTYPE')) {
          errorMessage = 'Received HTML response instead of JSON. The service may be unavailable or misconfigured.';
        } else {
          errorMessage = textContent || errorMessage;
        }
      }
      throw new Error(`Failed to upload document to LlamaIndex: ${errorMessage}`);
    }
    
    // Parse response as JSON
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      const textContent = await response.text();
      console.error('Failed to parse response as JSON:', textContent);
      throw new Error('Invalid response format from LlamaIndex service');
    }
    
    console.log('LlamaIndex upload result:', result);
    
    if (!result.job_id) {
      throw new Error('No job ID received from LlamaIndex');
    }
    
    return {
      job_id: result.job_id,
      status: 'pending',
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
      let errorMessage = 'Failed to get job status';
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
    
    // If job is still processing, wait and retry
    if (result.status !== 'completed' && result.status !== 'failed') {
      console.log(`Job ${jobId} is still processing. Waiting 2 seconds before retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return processLlamaIndexJob(jobId);
    }
    
    // If job completed successfully
    if (result.status === 'completed') {
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

// Convert a file to PDF if it's not already a PDF
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
