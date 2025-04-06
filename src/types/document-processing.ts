/**
 * Types for document processing functionality
 */

export interface DocumentProcessingStatus {
  id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  stage?: 'uploading' | 'processing' | 'parsing' | 'analyzing' | 'complete' | 'failed' | 'init' | 'storing' | 'syncing';
  progress?: number;
  message?: string;
}

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'pending' | 'granted' | 'denied';

export type DocumentType = 
  | 'pdf' 
  | 'text' 
  | 'google_doc' 
  | 'google_drive' 
  | 'docx' 
  | 'html' 
  | 'url' 
  | 'web_page';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: DocumentType;
  created_at: string;
  refresh_rate: number;
  notified_at?: string;
  access_status?: AccessStatus;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  storage_path?: string;
  metadata?: Record<string, any>;
}

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type: DocumentType;
  metadata?: Record<string, any>;
}

export interface DriveLinksProps {
  documents?: DocumentLink[];
  isLoading?: boolean;
  isUploading?: boolean;
  addDocumentLink?: (data: DocumentLinkFormData) => Promise<void>;
  deleteDocumentLink?: (linkId: number) => Promise<void>;
  uploadDocument?: (file: File) => Promise<void>;
  isClientView?: boolean;
  isValidating?: boolean;
  deletingId?: number | null;
  isDeleteLoading?: boolean;
}

export interface DocumentProcessingResult {
  success: boolean;
  error?: string;
  documentId?: string;
  jobId?: string;
  status?: string;
  documentUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  url?: string;
  uploadDate?: string;
  extractedText?: string;
  aiProcessed?: boolean;
  downloadUrl?: string;
  processed: number;
  failed: number;
  urlsScraped?: number;
  contentStored?: number;
  message?: string;
}

export interface DocumentProcessingRequest {
  client_id: string;
  document_url: string;
  document_type: DocumentType;
}

export interface DocumentProcessingOptions {
  clientId: string;
  documentType?: DocumentType;
  agentName?: string;
  shouldUseAI?: boolean;
  maxPages?: number;
  syncToAgent?: boolean;
  syncToProfile?: boolean;
  syncToWidgetSettings?: boolean;
  folder?: string;
  description?: string;
}

export interface DocumentChunk {
  content: string;
  metadata?: Record<string, any>;
  id?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
}

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress?: {
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
  };
}

export interface ParseResponse {
  success: boolean;
  text?: string;
  chunks?: DocumentChunk[];
  error?: string;
}

// Updated LlamaIndex types to ensure they're JSON serializable
export interface LlamaIndexJobResponse {
  job_id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface LlamaIndexParsingResult {
  job_id: string;
  status: string;
  parsed_content?: string;
  error?: string;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: string;
  modificationDate?: string;
  pageCount?: number;
  [key: string]: any;
}

// LlamaIndex specific types
export interface LlamaIndexProcessingOptions {
  shouldUseAI?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface LlamaIndexDocumentChunk {
  text: string;
  metadata?: {
    page_number?: number;
    source?: string;
    [key: string]: any;
  };
}

// This type ensures LlamaIndex responses can be serialized as JSON in metadata
export type JsonSerializable = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonSerializable }
  | JsonSerializable[];

// Helper type for Supabase JSON column
export type Json = JsonSerializable;
