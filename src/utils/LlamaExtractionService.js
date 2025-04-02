
import { supabase } from '../integrations/supabase/client';
import { LLAMA_CLOUD_API_KEY, LLAMA_EXTRACTION_AGENT_ID } from '../config/env';

// Base URL for Llama Cloud API
const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai/api/v1';

export class LlamaExtractionService {
  /**
   * Get the Llama API key from Supabase or environment variables
   */
  static async getApiKey() {
    try {
      // Try to get the API key from Supabase first
      const { data, error } = await supabase.functions.invoke('get-secrets', {
        body: { keys: ['LLAMA_CLOUD_API_KEY'] }
      });
      
      if (!error && data && data.LLAMA_CLOUD_API_KEY) {
        console.log('Using LLAMA_CLOUD_API_KEY from Supabase');
        return data.LLAMA_CLOUD_API_KEY;
      }
    } catch (err) {
      console.warn('Error getting LLAMA_CLOUD_API_KEY from Supabase:', err);
    }
    
    // Fallback to environment variable
    if (LLAMA_CLOUD_API_KEY) {
      console.log('Using LLAMA_CLOUD_API_KEY from environment');
      return LLAMA_CLOUD_API_KEY;
    }
    
    throw new Error('LLAMA_CLOUD_API_KEY not found in Supabase or environment');
  }

  /**
   * Upload a document to LlamaParse following their API documentation
   */
  static async uploadDocument(file) {
    console.log('Uploading document to LlamaParse:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    const apiKey = await this.getApiKey();
    const formData = new FormData();
    formData.append('upload_file', file);

    const response = await fetch(`${LLAMA_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('File uploaded successfully:', result);
    return result;
  }

  /**
   * Start an extraction job using the extraction agent and file ID
   */
  static async startExtractionJob(fileId, agentId = LLAMA_EXTRACTION_AGENT_ID) {
    console.log(`Starting extraction job for file ${fileId} with agent ${agentId}`);
    
    // Ensure we have an agent ID
    if (!agentId) {
      throw new Error('Extraction agent ID is required');
    }
    
    const apiKey = await this.getApiKey();
    const response = await fetch(`${LLAMA_API_BASE}/extraction/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        file_id: fileId,
        extraction_agent_id: agentId
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error starting extraction:', response.status, response.statusText, errorBody);
      throw new Error(`Failed to start extraction: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get extraction job result by job ID
   */
  static async getExtractionResult(jobId) {
    console.log(`Getting extraction result for job: ${jobId}`);
    
    const apiKey = await this.getApiKey();
    
    // Poll for result with exponential backoff
    let attempts = 0;
    const maxAttempts = 5;
    const initialDelay = 5000;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${LLAMA_API_BASE}/extraction/jobs/${jobId}/result`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        // Check if job is still pending
        if (response.status === 404) {
          console.log(`Extraction still in progress (attempt ${attempts + 1}/${maxAttempts}), waiting...`);
          await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, attempts)));
          attempts++;
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error('Result error details:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody
          });
          throw new Error(`Failed to get extraction result: ${response.statusText} - ${errorBody}`);
        }

        const result = await response.json();
        console.log('Extraction completed successfully');
        return result;
      } catch (error) {
        if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
          console.log(`Connection timeout on attempt ${attempts + 1}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, initialDelay));
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Extraction timed out after ${maxAttempts} attempts`);
  }
  
  /**
   * Check if a job exists and get its status
   */
  static async checkJobStatus(jobId) {
    const apiKey = await this.getApiKey();
    
    try {
      const response = await fetch(`${LLAMA_API_BASE}/extraction/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        return { exists: false, status: null };
      }
      
      const data = await response.json();
      return { exists: true, status: data.status, data };
    } catch (error) {
      console.error('Error checking job status:', error);
      return { exists: false, status: null, error: error.message };
    }
  }
}
