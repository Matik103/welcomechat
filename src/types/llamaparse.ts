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
  status?: 'success' | 'error' | 'processing';
  errorMessage?: string;
}

export interface LlamaParseRequest {
  file: File;
  metadata?: Record<string, any>;
}

export interface LlamaParseResponse {
  status: 'success' | 'error';
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
  documentId?: string;
}

export interface LlamaParseConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface LlamaParseErrorResponse {
  message: string;
}

export interface LlamaParseSuccessResponse {
  content: string;
  metadata: Record<string, any>;
  documentId?: string;
  status?: 'success' | 'error' | 'processing';
}
