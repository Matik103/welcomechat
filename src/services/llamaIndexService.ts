
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { LlamaIndexJobResponse } from '@/types/document-processing';
import { env } from '@/config/env';

const API_KEY = env.LLAMA_CLOUD_API_KEY;
const API_URL = 'https://api.cloud.llamaindex.ai/api/parsing';

/**
 * Upload a document to LlamaIndex for processing
 */
export const uploadDocumentToLlamaIndex = async (
  file: File, 
  options: any = {}
): Promise<LlamaIndexJobResponse> => {
  try {
    console.log(`Uploading file to LlamaIndex API: ${file.name}`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log("LlamaIndex upload response:", response.data);
    
    return {
      job_id: response.data.job_id || uuidv4(),
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
 * Process a LlamaIndex job by polling until completion
 */
export const processLlamaIndexJob = async (jobId: string): Promise<any> => {
  try {
    console.log(`Processing LlamaIndex job: ${jobId}`);
    
    // Poll for completion
    let status = 'PENDING';
    let attempts = 0;
    let result = null;
    
    while (status === 'PENDING' || status === 'PROCESSING') {
      if (attempts > 30) {
        throw new Error('Job processing timeout');
      }
      
      // Wait between polling attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check job status
      const response = await axios.get(`${API_URL}/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      status = response.data.status;
      console.log(`Job ${jobId} status: ${status}`);
      
      if (status === 'SUCCEEDED') {
        // Get the result
        const resultResponse = await axios.get(`${API_URL}/job/${jobId}/result`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        
        result = resultResponse.data;
        break;
      } else if (status === 'FAILED') {
        throw new Error(`Job processing failed: ${response.data.error || 'Unknown error'}`);
      }
      
      attempts++;
    }
    
    return {
      status,
      job_id: jobId,
      parsed_content: result
    };
  } catch (error) {
    console.error('Error in processLlamaIndexJob:', error);
    throw error;
  }
};
