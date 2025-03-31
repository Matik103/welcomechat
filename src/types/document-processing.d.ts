
export type DocumentType = 'document' | 'google_drive' | 'google_sheet' | 'web_page' | 'pdf' | 'docx' | 'text' | 'html' | 'other' | 'url';
export type AccessStatus = 'granted' | 'pending' | 'denied' | 'unknown' | 'accessible' | 'inaccessible';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: DocumentType | string;
  refresh_rate: number;
  created_at: string;
  updated_at?: string | null;
  access_status?: AccessStatus | null;
  last_processed?: string | null;
  status?: string | null;
  notified_at?: string | null;
}

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type: DocumentType | string;
}

export interface DocumentProcessingResult {
  success: boolean;
  error?: string | null;
  processed: number;
  failed: number;
  jobId?: string;
  message?: string;
  status?: string;
  documentId?: string;
  documentUrl?: string;
  urlsScraped?: number;
  contentStored?: number;
}

export interface DocumentUploadFormData {
  file: File;
}

export interface DocumentProcessingStatus {
  id: string;
  status: string;
  processed_count: number;
  failed_count: number;
  error?: string;
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

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
}
