
import { supabase } from '../integrations/supabase/client';
import { LLAMA_CLOUD_API_KEY } from '../config/env';

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
   * Upload a document to LlamaParse
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
   * Start an extraction job
   */
  static async startExtractionJob(fileId, agentId) {
    console.log(`Starting extraction job for file ${fileId} with agent ${agentId}`);
    
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
   * Get extraction job result
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

        const responseBody = await response.json();

        if (response.status === 200) {
          console.log('Extraction completed successfully');
          return responseBody;
        }

        if (!responseBody.detail?.includes('PENDING')) {
          console.error('Result error details:', {
            status: response.status,
            statusText: response.statusText,
            body: JSON.stringify(responseBody)
          });
          throw new Error(`Failed to get extraction result: ${response.statusText} - ${JSON.stringify(responseBody)}`);
        }

        console.log(`Extraction still pending (attempt ${attempts + 1}/${maxAttempts}), waiting ${initialDelay * Math.pow(2, attempts)}ms...`);
        await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, attempts)));
        attempts++;
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
}
