
export interface DocumentProcessingResult {
  success: boolean;
  error?: string;
  processed: number;
  failed: number;
  documentId?: string;
  documentUrl?: string;
  extractedText?: string;
  jobId?: string;
  status?: string;
}

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
}

export interface DocumentLinkFormData {
  link: string;
  document_type?: DocumentType;
  refresh_rate?: number;
  metadata?: Record<string, any>;
}

export type DocumentType = 'pdf' | 'document' | 'google_drive' | 'web_page' | 'csv' | 'excel' | 'text';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: DocumentType;
  refresh_rate: number;
  created_at: string;
  updated_at: string;
  access_status?: string;
  storage_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  notified_at?: string;
  metadata?: Record<string, any>;
}

export interface ProcessDocumentOptions {
  clientId: string;
  agentName?: string;
  metadata?: Record<string, any>;
}
