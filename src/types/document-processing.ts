
/**
 * Types for document processing functionality
 */

export interface DocumentProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
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

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type: string;
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
  processed: number;
  failed: number;
  urlsScraped?: number;
  contentStored?: number;
  message?: string;
  extractedText?: string;
}

export interface DocumentProcessingRequest {
  client_id: string;
  document_url: string;
  document_type: string;
}

export interface DocumentProcessingOptions {
  clientId: string;
  documentType?: string;
  agentName?: string;
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
}

export interface ParseResponse {
  success: boolean;
  text?: string;
  chunks?: DocumentChunk[];
  error?: string;
}
