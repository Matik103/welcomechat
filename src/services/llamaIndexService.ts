import axios, { RawAxiosRequestHeaders } from 'axios';
import { 
  DocumentProcessingOptions,
  DocumentProcessingResult
} from '@/types/document-processing';
import { 
  ProcessingProgress,
  CreditEstimate,
  CacheConfig,
  LlamaParseJobResponse,
  LlamaParseResult,
  LlamaParseOptions,
  DocumentChunk,
  LlamaParseResponse
} from '@/types/llama-parse';
import { LLAMA_CLOUD_API_KEY } from '@/config/env';
import { createHash } from 'crypto';
import { getDatabaseService } from './database';
import { v4 as uuidv4 } from 'uuid';

// Use Vite proxy in development, Supabase Edge Function in production
const isDevelopment = import.meta.env.MODE === 'development';
const API_URL = isDevelopment 
  ? '/api/llama'  // This will be proxied through Vite
  : 'https://mgjodiqecnnltsgorife.supabase.co/functions/v1/llama-index-proxy';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Default options
const DEFAULT_OPTIONS: LlamaParseOptions = {
  enableProgressTracking: true,
  estimateCredits: true,
  maxRetries: 3,
  retryDelay: 2000,
  timeout: 300000, // 5 minutes
  cacheConfig: {
    enableCache: true,
    cacheTTL: 3600, // 1 hour
    cacheKey: ''
  }
};

if (!LLAMA_CLOUD_API_KEY) {
  console.error('LlamaParse API key is not set. Please set VITE_LLAMA_CLOUD_API_KEY in your environment variables.');
}

if (!isDevelopment && !SUPABASE_ANON_KEY) {
  console.error('Supabase anonymous key is not set. Please set VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// Create axios instance with appropriate headers based on environment
const llamaParseClient = axios.create({
  baseURL: API_URL,
  headers: isDevelopment
    ? {
        'Authorization': `Bearer ${LLAMA_CLOUD_API_KEY}`,
        'Content-Type': 'application/json'
      } as RawAxiosRequestHeaders
    : {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'X-LlamaParse-API-Key': LLAMA_CLOUD_API_KEY
      } as RawAxiosRequestHeaders
});

/**
 * Generate a cache key for a file
 */
async function generateCacheKey(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = createHash('sha256');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}

/**
 * Estimate credits needed for processing
 */
function estimateCredits(file: File): CreditEstimate {
  // Rough estimation based on file size
  const baseCredits = 30;
  const perPageCredits = 3;
  const estimatedPages = Math.ceil(file.size / 3000); // Rough estimate: 3KB per page
  
  return {
    estimatedCredits: baseCredits + (perPageCredits * estimatedPages),
    baseCredits,
    perPageCredits,
    totalPages: estimatedPages
  };
}

/**
 * Upload a file to LlamaParse for processing
 */
export const uploadFileToLlamaParse = async (
  file: File,
  options: LlamaParseOptions = DEFAULT_OPTIONS
): Promise<LlamaParseJobResponse> => {
  try {
    console.log(`Uploading file to LlamaParse: ${file.name}`);
    
    // Generate cache key if caching is enabled
    let cacheKey = '';
    if (options.cacheConfig?.enableCache) {
      cacheKey = await generateCacheKey(file);
      options.cacheConfig.cacheKey = cacheKey;
    }
    
    // Estimate credits if enabled
    const creditEstimate = options.estimateCredits ? estimateCredits(file) : undefined;
    
    const formData = new FormData();
    formData.append('file', file);
    if (cacheKey) {
      formData.append('cache_key', cacheKey);
    }
    
    // Create new headers for form data upload
    const uploadHeaders = {
      ...llamaParseClient.defaults.headers.common,
      'Content-Type': 'multipart/form-data'
    } as RawAxiosRequestHeaders;
    
    const response = await llamaParseClient.post(
      isDevelopment ? '/upload' : '/process_file',
      formData,
      {
        headers: uploadHeaders,
        timeout: options.timeout
      }
    );
    
    return {
      ...response.data,
      creditEstimate,
      progress: options.enableProgressTracking ? {
        totalPages: creditEstimate?.totalPages || 1,
        processedPages: 0,
        status: 'pending'
      } : undefined
    };
  } catch (error: any) {
    console.error("Error uploading file to LlamaParse:", error.response ? error.response.data : error.message);
    throw new Error(`Failed to upload document to LlamaParse: ${JSON.stringify(error.response?.data || error.message)}`);
  }
};

/**
 * Check the status of a LlamaParse parsing job
 */
export const checkParsingStatus = async (
  jobId: string,
  options: LlamaParseOptions = DEFAULT_OPTIONS
): Promise<LlamaParseJobResponse> => {
  try {
    const response = await llamaParseClient.get(
      isDevelopment ? `/job/${jobId}` : `/job_status/${jobId}`,
      { timeout: options.timeout }
    );
    
    const status = response.data.status.toLowerCase();
    let progress: ProcessingProgress | undefined;
    
    if (options.enableProgressTracking) {
      progress = {
        totalPages: response.data.total_pages || 1,
        processedPages: response.data.processed_pages || 0,
        status,
        estimatedTimeRemaining: response.data.estimated_time_remaining
      };
    }
    
    return {
      ...response.data,
      status,
      progress
    };
  } catch (error: any) {
    console.error(`Error checking parsing status for ${jobId}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to check job status: ${JSON.stringify(error.response?.data || error.message)}`);
  }
};

/**
 * Get the parsing results in Markdown format
 */
export const getMarkdownResults = async (
  jobId: string,
  options: LlamaParseOptions = DEFAULT_OPTIONS
): Promise<LlamaParseResult> => {
  try {
    const response = await llamaParseClient.get<LlamaParseResponse>(
      isDevelopment ? `/job/${jobId}/result/markdown` : `/job_results/${jobId}`,
      { timeout: options.timeout }
    );
    
    // Create a single chunk with the markdown content
    const chunk: DocumentChunk = {
      content: response.data.markdown,
      metadata: {
        format: 'markdown',
        job_id: jobId
      }
    };
    
    return {
      chunks: [chunk],
      length: response.data.markdown.length,
      metadata: response.data.job_metadata,
      progress: options.enableProgressTracking ? {
        totalPages: response.data.job_metadata.job_pages,
        processedPages: response.data.job_metadata.job_pages,
        status: 'completed'
      } : undefined
    };
  } catch (error: any) {
    console.error("Error getting markdown results from LlamaParse:", error.response ? error.response.data : error.message);
    throw new Error(`Failed to get parsing results: ${JSON.stringify(error.response?.data || error.message)}`);
  }
};

/**
 * Process a document with retries and progress tracking
 */
export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: DocumentProcessingOptions & LlamaParseOptions = DEFAULT_OPTIONS
): Promise<DocumentProcessingResult> => {
  try {
    const response = await uploadFileToLlamaParse(file, options);
    return {
      success: true,
      jobId: response.id,
      status: response.status,
      processed: 0,
      failed: 0,
      creditEstimate: response.creditEstimate
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      processed: 0,
      failed: 1
    };
  }
};

/**
 * Process a LlamaParse job with retries and progress tracking
 */
export const processLlamaIndexJob = async (
  jobId: string,
  options: LlamaParseOptions = DEFAULT_OPTIONS
): Promise<DocumentProcessingResult> => {
  try {
    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts < (options.maxRetries || DEFAULT_OPTIONS.maxRetries!)) {
      try {
        const status = await checkParsingStatus(jobId, options);
        
        if (status.status === 'completed') {
          const results = await getMarkdownResults(jobId, options);
          return {
            success: true,
            status: 'SUCCEEDED',
            extractedText: results.chunks[0].content,
            processed: 1,
            failed: 0,
            progress: results.progress,
            metadata: results.metadata
          };
        } else if (status.status === 'failed') {
          return {
            success: false,
            status: 'FAILED',
            error: status.error || 'Processing failed',
            processed: 0,
            failed: 1,
            progress: status.progress
          };
        }
        
        // Still processing, wait before retry
        await new Promise(resolve => setTimeout(resolve, options.retryDelay || DEFAULT_OPTIONS.retryDelay!));
        attempts++;
        
      } catch (error: any) {
        lastError = error;
        attempts++;
        if (attempts >= (options.maxRetries || DEFAULT_OPTIONS.maxRetries!)) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, options.retryDelay || DEFAULT_OPTIONS.retryDelay!));
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      processed: 0,
      failed: 1
    };
  }
};

// Helper function for file conversion (stub - implement if needed)
export const convertToPdfIfNeeded = async (file: File): Promise<File> => {
  // For now, just return the original file
  // Implement PDF conversion logic if needed
  return file;
};

export interface LlamaParseMetadata {
  credits_used: number;
  job_credits_usage: number;
  job_pages: number;
  job_auto_mode_triggered_pages: number;
  job_is_cache_hit: boolean;
  credits_max: number;
}

export interface LlamaParseResponse {
  job_id: string;
  status: string;
  metadata?: LlamaParseMetadata;
  content?: string;
}

export async function uploadAndProcessDocument(file: File, clientId: string): Promise<LlamaParseResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VITE_LLAMA_CLOUD_API_KEY}`
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }

  const { job_id } = await uploadResponse.json();
  
  // Save initial job record
  const dbService = getDatabaseService();
  const documentId = uuidv4();
  const timestamp = new Date().toISOString();

  await dbService.saveDocumentProcessingJob({
    client_id: clientId,
    agent_name: 'LlamaParse Agent',
    document_id: documentId,
    document_type: file.type,
    document_url: URL.createObjectURL(file),
    status: 'pending',
    created_at: timestamp,
    updated_at: timestamp,
    metadata: {
      credits_used: 0,
      pages_processed: 0,
      cache_hit: false
    }
  });

  // Poll for job completion
  let result: LlamaParseResponse;
  while (true) {
    const statusResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/parsing/job/${job_id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.VITE_LLAMA_CLOUD_API_KEY}`
        }
      }
    );

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.statusText}`);
    }

    const status = await statusResponse.json();
    
    if (status.status === 'COMPLETED' || status.status === 'FAILED') {
      result = {
        job_id,
        status: status.status,
        metadata: status.metadata
      };
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // If job completed successfully, get the content
  if (result.status === 'COMPLETED') {
    const contentResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/parsing/job/${job_id}/result/markdown`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.VITE_LLAMA_CLOUD_API_KEY}`
        }
      }
    );

    if (!contentResponse.ok) {
      throw new Error(`Content retrieval failed: ${contentResponse.statusText}`);
    }

    const content = await contentResponse.text();
    result.content = content;

    // Save agent with extracted content
    const agent = await dbService.saveAgent({
      client_id: clientId,
      name: 'LlamaParse Agent',
      description: `Processed document: ${file.name}`,
      created_at: timestamp,
      updated_at: timestamp,
      content,
      metadata: {
        source: 'llamaparse',
        document_type: file.type,
        processing_metadata: result.metadata!
      }
    });

    // Update job status
    await dbService.saveDocumentProcessingJob({
      client_id: clientId,
      agent_name: agent.name,
      document_id: documentId,
      document_type: file.type,
      document_url: URL.createObjectURL(file),
      status: 'completed',
      created_at: timestamp,
      updated_at: new Date().toISOString(),
      metadata: {
        credits_used: result.metadata!.credits_used,
        pages_processed: result.metadata!.job_pages,
        cache_hit: result.metadata!.job_is_cache_hit
      }
    });
  }

  return result;
}
