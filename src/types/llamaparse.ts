/**
 * Types for the LlamaParse document processing service
 */

import FormData from 'form-data';

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
  file: FormData;
  metadata?: Record<string, any>;
}

export interface LlamaParseResponse {
  status: 'success' | 'error';
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface LlamaParseConfig {
  apiKey: string;
  baseUrl?: string;
}
