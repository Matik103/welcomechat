
/**
 * Document processing type definitions
 */

export type DocumentType = 'pdf' | 'docx' | 'txt' | 'csv' | 'xlsx' | 'md' | 'html' | 'google_drive' | 'document' | 'url';

export interface DocumentProcessingOptions {
  shouldExtractText?: boolean;
  shouldParsePDF?: boolean;
  shouldUseAI?: boolean;
  maxPages?: number;
  syncToAgent?: boolean;
  clientId: string;
  documentType?: string;
  agentName?: string;
  processingMethod?: 'auto' | 'text' | 'pdf' | 'docx' | 'csv' | 'html';
}

export interface DocumentProcessingStatus {
  status?: 'init' | 'uploading' | 'parsing' | 'processing' | 'storing' | 'syncing' | 'completed' | 'failed';
  stage?: 'init' | 'uploading' | 'parsing' | 'processing' | 'storing' | 'syncing' | 'completed' | 'failed' | 'analyzing';
  progress?: number;
  message?: string;
  error?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  error?: string;
  processed: number;
  failed: number;
  aiProcessed?: number;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  documentId?: string;
  documentUrl?: string;
  extractedText?: string;
  message?: string;
  downloadUrl?: string;
}

export interface LlamaIndexProcessingOptions {
  shouldUseAI?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface LlamaIndexJobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface LlamaIndexParsingResult {
  chunks: DocumentChunk[];
  length: number;
}

export interface DocumentChunk {
  id?: string;
  content: string;
  metadata: {
    format: string;
    job_id: string;
    [key: string]: any;
  };
}

export interface DocumentMetadata {
  file_name: string;
  file_size: number;
  file_type: string;
  content_type?: string;
  storage_path: string;
  processing_completed?: string;
  llama_job_id?: LlamaIndexJobResponse;
  [key: string]: any;
}

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
}

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: string;
  created_at: string;
  refresh_rate: number;
  notified_at?: string;
  access_status?: AccessStatus;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  storage_path?: string;
}

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'pending' | 'granted' | 'denied';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
}
