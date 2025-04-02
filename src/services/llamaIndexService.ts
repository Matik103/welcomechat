
import { supabase } from '@/integrations/supabase/client';
import { 
  LlamaIndexJobResponse, 
  LlamaIndexParsingResult, 
  LlamaIndexProcessingOptions 
} from '@/types/document-processing';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';

const LLAMA_CLOUD_API_URL = 'https://cloud.llamaindex.ai/api/v1';

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
    
    // Make the API request to LlamaIndex Cloud
    const response = await fetch(`${LLAMA_CLOUD_API_URL}/process_file`, {
      method: 'POST',
      headers: {
        'x-api-key': LLAMA_CLOUD_API_KEY,
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
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
    
    const response = await fetch(`${LLAMA_CLOUD_API_URL}/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'x-api-key': LLAMA_CLOUD_API_KEY,
        'Content-Type': 'application/json',
      },
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
