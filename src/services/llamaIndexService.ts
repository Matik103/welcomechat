
import axios from 'axios';
import { 
  LlamaIndexJobResponse, 
  LlamaIndexParsingResult, 
  LlamaIndexProcessingOptions,
  DocumentChunk
} from '@/types/document-processing';
import { env } from '@/config/env';

const API_URL = 'https://api.cloud.llamaindex.ai/api/parsing';
const API_KEY = env.LLAMA_CLOUD_API_KEY;

/**
 * Upload a file to LlamaParse for processing
 */
export const uploadFileToLlamaParse = async (
  file: File
): Promise<LlamaIndexJobResponse> => {
  try {
    console.log(`Uploading file to LlamaParse: ${file.name}`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log("LlamaParse upload initiated:", response.data);
    return {
      job_id: response.data.job_id,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Error uploading file to LlamaParse:", error.response ? error.response.data : error.message);
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};

/**
 * Check the status of a LlamaParse parsing job
 */
export const checkParsingStatus = async (jobId: string): Promise<LlamaIndexJobResponse> => {
  try {
    const response = await axios.get(`${API_URL}/job/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'accept': 'application/json'
      }
    });
    
    console.log(`Job status for ${jobId}:`, response.data);
    return {
      job_id: jobId,
      status: response.data.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error: any) {
    console.error(`Error checking parsing status for ${jobId}:`, error.response ? error.response.data : error.message);
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};

/**
 * Get the parsing results in Markdown format
 */
export const getMarkdownResults = async (jobId: string): Promise<LlamaIndexParsingResult> => {
  try {
    const response = await axios.get(`${API_URL}/job/${jobId}/result/markdown`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'accept': 'application/json'
      }
    });
    
    console.log("Retrieved markdown results from LlamaParse");
    
    // Create a single chunk with the markdown content
    const chunk: DocumentChunk = {
      content: response.data,
      metadata: {
        format: 'markdown',
        job_id: jobId
      }
    };
    
    return {
      chunks: [chunk],
      length: response.data.length
    };
  } catch (error: any) {
    console.error("Error getting markdown results from LlamaParse:", error.response ? error.response.data : error.message);
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};

// Compatibility functions for existing code
export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: LlamaIndexProcessingOptions
): Promise<LlamaIndexJobResponse> => {
  return uploadFileToLlamaParse(file);
};

export const processLlamaIndexJob = async (jobId: string): Promise<any> => {
  const status = await checkParsingStatus(jobId);
  if (status.status === 'completed') {
    const results = await getMarkdownResults(jobId);
    return {
      status: 'SUCCEEDED',
      parsed_content: results.chunks[0].content
    };
  }
  return {
    status: status.status.toUpperCase(),
    parsed_content: null
  };
};

// Helper function for file conversion (stub - implement if needed)
export const convertToPdfIfNeeded = async (file: File): Promise<File> => {
  // For now, just return the original file
  // Implement PDF conversion logic if needed
  return file;
};
