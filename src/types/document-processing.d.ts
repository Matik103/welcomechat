
/**
 * Document processing type definitions
 */

export interface DocumentProcessingOptions {
  shouldExtractText?: boolean;
  shouldParsePDF?: boolean;
  shouldUseAI?: boolean;
  maxPages?: number;
}

export interface DocumentProcessingStatus {
  stage: 'uploading' | 'processing' | 'parsing' | 'analyzing' | 'complete' | 'failed';
  progress: number;
  message?: string;
  error?: Error;
}

export interface DocumentProcessingResult {
  documentId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadDate: string;
  extractedText?: string;
  aiSummary?: string;
  aiProcessed: boolean;
  status: 'success' | 'failed' | 'pending';
  metadata?: Record<string, any>;
}

export interface LlamaIndexProcessingOptions {
  shouldUseAI?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface LlamaIndexJobResponse {
  job_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  error?: string;
}

export interface LlamaIndexParsingResult {
  job_id: string;
  status: 'SUCCEEDED' | 'FAILED';
  parsed_content?: string;
  error?: string;
  document_chunks?: LlamaIndexDocumentChunk[];
}

export interface LlamaIndexDocumentChunk {
  text: string;
  metadata?: {
    page_number?: number;
    source?: string;
    [key: string]: any;
  };
}
