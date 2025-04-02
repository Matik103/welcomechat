import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';
import { 
  LlamaIndexJobResponse, 
  LlamaIndexParsingResult, 
  LlamaIndexProcessingOptions
} from '@/types/document-processing';

const LLAMA_INDEX_API_URL = process.env.LLAMA_INDEX_API_URL || 'http://localhost:8000';

/**
 * Process a document with Llama Index
 */
export const processDocumentWithLlamaIndex = async (
  fileUrl: string,
  options: LlamaIndexProcessingOptions
): Promise<LlamaIndexJobResponse> => {
  try {
    console.log(`Sending document for processing to Llama Index: ${fileUrl}`);
    
    const response = await axios.post(`${LLAMA_INDEX_API_URL}/process_document`, {
      file_url: fileUrl,
      client_id: options.clientId,
      chunk_size: options.chunkSize || 512,
      chunk_overlap: options.overlapSize || 50
    });
    
    console.log("Llama Index processing initiated:", response.data);
    return response.data as LlamaIndexJobResponse;
  } catch (error: any) {
    console.error("Error processing document with Llama Index:", error.response ? error.response.data : error.message);
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};

/**
 * Get the status of a Llama Index job
 */
export const getLlamaIndexJobStatus = async (jobId: string): Promise<LlamaIndexJobResponse> => {
  try {
    const response = await axios.get(`${LLAMA_INDEX_API_URL}/job_status/${jobId}`);
    console.log(`Job status for ${jobId}:`, response.data);
    return response.data as LlamaIndexJobResponse;
  } catch (error: any) {
    console.error(`Error getting job status for ${jobId}:`, error.response ? error.response.data : error.message);
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};

/**
 * Parse a document with Llama Index
 */
export const parseDocumentWithLlamaIndex = async (
  fileUrl: string,
  options: LlamaIndexProcessingOptions
): Promise<LlamaIndexParsingResult> => {
  try {
    console.log(`Sending document for parsing to Llama Index: ${fileUrl}`);
    
    const response = await axios.post(`${LLAMA_INDEX_API_URL}/parse_document`, {
      file_url: fileUrl,
      client_id: options.clientId,
      chunk_size: options.chunkSize || 512,
      chunk_overlap: options.overlapSize || 50
    });
    
    console.log("Llama Index parsing complete:", response.data);
    return response.data as LlamaIndexParsingResult;
  } catch (error: any) {
    console.error("Error parsing document with Llama Index:", error.response ? error.response.data : error.message);
    throw new Error(error.response ? error.response.data.message : error.message);
  }
};
