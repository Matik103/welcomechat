
/**
 * Types for the LlamaParse document processing service
 */

export interface LlamaParseResult {
  content: string;
  metadata: LlamaParseMetadata;
}

export interface LlamaParseMetadata {
  documentId?: string;
  author?: string;
  createdAt?: string;
  title?: string;
  pages?: number;
  language?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  status?: 'success' | 'failed' | 'processing';
  errorMessage?: string;
}

export interface LlamaParseRequest {
  file: File;
  metadata?: Record<string, any>;
}

export interface LlamaParseResponse {
  status: 'success' | 'failed' | 'processing';
  content?: string;
  documentId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface LlamaParseConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  documentId?: string;
  error?: string;
  content?: string;
  status?: 'success' | 'failed' | 'processing' | 'pending';
}
