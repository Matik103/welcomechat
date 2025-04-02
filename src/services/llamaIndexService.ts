
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';
import { toast } from 'sonner';

interface LlamaIndexParsingJobResponse {
  job_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  error?: string;
  created_at: string;
  updated_at: string;
}

interface LlamaIndexParsingResult {
  text: string;
  metadata?: Record<string, any>;
}

/**
 * Upload a document to LlamaIndex for parsing
 * @param file The file to upload
 * @returns Promise with job ID
 */
export const uploadDocumentToLlamaIndex = async (
  file: File | Blob
): Promise<string> => {
  if (!LLAMA_CLOUD_API_KEY) {
    throw new Error('LlamaIndex API key not set. Please set LLAMA_CLOUD_API_KEY in environment.');
  }

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not set. LlamaIndex requires an OpenAI API key to process documents.');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Include OpenAI API key in the request metadata
    formData.append('metadata', JSON.stringify({
      openai_api_key: OPENAI_API_KEY,
      use_openai: true
    }));

    const response = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LlamaIndex upload error:', errorText);
      throw new Error(`LlamaIndex upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as LlamaIndexParsingJobResponse;
    console.log('LlamaIndex upload success, job ID:', result.job_id);
    return result.job_id;
  } catch (error) {
    console.error('Error uploading document to LlamaIndex:', error);
    throw error;
  }
};

/**
 * Check the status of a LlamaIndex parsing job
 * @param jobId The job ID to check
 * @returns The job status response
 */
export const checkLlamaIndexJobStatus = async (
  jobId: string
): Promise<LlamaIndexParsingJobResponse> => {
  if (!LLAMA_CLOUD_API_KEY) {
    throw new Error('LlamaIndex API key not set. Please set LLAMA_CLOUD_API_KEY in environment.');
  }

  try {
    const response = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LlamaIndex job status error:', errorText);
      throw new Error(`Failed to check job status: ${response.status} ${response.statusText}`);
    }

    return await response.json() as LlamaIndexParsingJobResponse;
  } catch (error) {
    console.error('Error checking LlamaIndex job status:', error);
    throw error;
  }
};

/**
 * Get the results of a LlamaIndex parsing job in Markdown format
 * @param jobId The job ID to get results for
 * @returns The parsed text from the document
 */
export const getLlamaIndexJobResult = async (
  jobId: string
): Promise<string> => {
  if (!LLAMA_CLOUD_API_KEY) {
    throw new Error('LlamaIndex API key not set. Please set LLAMA_CLOUD_API_KEY in environment.');
  }

  try {
    const response = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LlamaIndex job result error:', errorText);
      throw new Error(`Failed to get job result: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('Error getting LlamaIndex job result:', error);
    throw error;
  }
};

/**
 * Process and wait for results from LlamaIndex
 * @param jobId The job ID to process
 * @param maxAttempts Maximum number of polling attempts
 * @param delayMs Delay between polling attempts in milliseconds
 * @returns The extracted text from the document
 */
export const processLlamaIndexJob = async (
  jobId: string,
  maxAttempts: number = 30,
  delayMs: number = 5000
): Promise<string> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const status = await checkLlamaIndexJobStatus(jobId);
      console.log(`LlamaIndex job status (attempt ${attempts}/${maxAttempts}):`, status.status);
      
      if (status.status === 'SUCCEEDED') {
        // Job completed successfully, get the results
        return await getLlamaIndexJobResult(jobId);
      } else if (status.status === 'FAILED') {
        throw new Error(`LlamaIndex job failed: ${status.error || 'Unknown error'}`);
      }
      
      // Job still processing, wait and try again
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`Error checking job status (attempt ${attempts}/${maxAttempts}):`, error);
      
      // Wait and try again
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error(`LlamaIndex job timed out after ${maxAttempts} attempts`);
};

/**
 * Process a document using LlamaIndex with OpenAI
 * @param file The file to process
 * @returns The extracted text and metadata
 */
export const processDocumentWithLlamaIndex = async (
  file: File | Blob
): Promise<{ text: string, metadata: Record<string, any> }> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for LlamaIndex document processing');
  }
  
  try {
    // 1. Upload document to LlamaIndex
    const jobId = await uploadDocumentToLlamaIndex(file);
    
    // 2. Process the job and wait for results
    const extractedText = await processLlamaIndexJob(jobId);
    
    // 3. Return the results
    return {
      text: extractedText,
      metadata: {
        jobId,
        processingMethod: 'llamaindex',
        processingTime: new Date().toISOString(),
        openaiEnabled: true
      }
    };
  } catch (error) {
    console.error('Error processing document with LlamaIndex:', error);
    throw error;
  }
};
