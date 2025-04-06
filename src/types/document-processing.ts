
// Document and processing related types
import { DocumentProcessingStatus, DocumentProcessingResult, AccessStatus, ValidationResult, DocumentLinkFormData } from './document-processing.d';

export type DocumentType = 'document' | 'google_drive' | 'google_sheet' | 'google_doc' | 'website';

export interface DocumentStatus {
  id: string;
  status: string;
  error?: string;
  metadata: Record<string, any>;
}

export interface DocumentProcessingJob {
  id: string;
  document_id: string;
  document_url: string;
  document_type: DocumentType;
  agent_name: string;
  client_id: string;
  status: string;
  error?: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  content: string;
  metadata: Record<string, any>;
  id?: string; // Add id as optional property to match usage
}

export interface DocumentProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  includeMetadata?: boolean;
  onProgress?: (progress: number) => void;
}

// Add support for DocumentLink type used in the project
export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: DocumentType;
  access_status: string;
  created_at: string;
  updated_at: string;
  refresh_rate: number;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  storage_path?: string;
  metadata?: Record<string, any>;
}

// Re-export types from document-processing.d.ts to make them available
export { DocumentProcessingStatus, DocumentProcessingResult, AccessStatus, ValidationResult, DocumentLinkFormData };
