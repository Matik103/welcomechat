
import { LlamaIndexJobResponse, LlamaIndexParsingResult } from '@/types/document-processing';
import { toast } from 'sonner';
import { LLAMA_CLOUD_API_KEY, OPENAI_API_KEY } from '@/config/env';

/**
 * Process a document using LlamaIndex API
 */
export async function processDocumentWithLlamaIndex(
  file: File,
  options: {
    shouldUseAI?: boolean;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<LlamaIndexParsingResult | null> {
  // Check if API keys are available
  if (!LLAMA_CLOUD_API_KEY || !OPENAI_API_KEY) {
    console.warn('LlamaIndex or OpenAI API keys not configured, skipping AI processing');
    return null;
  }

  try {
    // Step 1: Upload document to LlamaIndex
    const uploadResponse = await uploadDocumentToLlamaIndex(file);
    
    if (!uploadResponse || !uploadResponse.job_id) {
      throw new Error('Failed to upload document to LlamaIndex API');
    }

    const jobId = uploadResponse.job_id;
    
    // Step 2: Poll for job completion
    const result = await pollForJobCompletion(jobId);
    
    if (!result) {
      throw new Error('Failed to get parsing results from LlamaIndex API');
    }
    
    return result;
  } catch (error) {
    console.error('LlamaIndex processing error:', error);
    if (error instanceof Error) {
      toast.error(`Document processing failed: ${error.message}`);
    } else {
      toast.error('Document processing failed due to an unknown error');
    }
    return null;
  }
}

/**
 * Upload a document to LlamaIndex API
 */
async function uploadDocumentToLlamaIndex(file: File): Promise<LlamaIndexJobResponse | null> {
  try {
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Make API request to LlamaIndex
    const response = await fetch('https://api.cloud.llamaindex.ai/api/parse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
        'X-OpenAI-Api-Key': OPENAI_API_KEY || '',
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`LlamaIndex API error (${response.status}): ${errorData?.error || response.statusText}`);
    }
    
    const data = await response.json();
    return data as LlamaIndexJobResponse;
  } catch (error) {
    console.error('Error uploading document to LlamaIndex:', error);
    return null;
  }
}

/**
 * Poll for job completion
 */
async function pollForJobCompletion(
  jobId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<LlamaIndexParsingResult | null> {
  let attempts = 0;
  
  // Function to get job status
  const checkJobStatus = async (): Promise<LlamaIndexParsingResult | null> => {
    try {
      const response = await fetch(`https://api.cloud.llamaindex.ai/api/parse/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`LlamaIndex API error (${response.status}): ${errorData?.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if job completed
      if (data.status === 'SUCCEEDED') {
        return data as LlamaIndexParsingResult;
      } else if (data.status === 'FAILED') {
        throw new Error(`LlamaIndex job failed: ${data.error || 'Unknown error'}`);
      }
      
      // Still processing
      return null;
    } catch (error) {
      console.error('Error checking LlamaIndex job status:', error);
      throw error;
    }
  };
  
  // Poll for status until complete or max attempts reached
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const result = await checkJobStatus();
      
      if (result) {
        return result;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error(`Polling attempt ${attempts} failed:`, error);
      if (attempts >= maxAttempts) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  throw new Error(`LlamaIndex job timed out after ${maxAttempts} attempts`);
}

/**
 * Get parsing results for a completed job
 */
export async function getParsingResults(jobId: string): Promise<LlamaIndexParsingResult | null> {
  try {
    const response = await fetch(`https://api.cloud.llamaindex.ai/api/parse/results/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`LlamaIndex API error (${response.status}): ${errorData?.error || response.statusText}`);
    }
    
    const data = await response.json();
    return data as LlamaIndexParsingResult;
  } catch (error) {
    console.error('Error getting LlamaIndex parsing results:', error);
    return null;
  }
}
