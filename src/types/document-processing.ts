
// Document and processing related types

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
