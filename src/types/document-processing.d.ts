
export type DocumentType = 'google_drive' | 'google_doc' | 'google_sheet' | 'google_slide' | 'document' | 'pdf' | 'image';
export type AccessStatus = 'granted' | 'denied' | 'pending' | 'unknown' | 'accessible' | 'inaccessible';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: DocumentType;
  refresh_rate: number;
  access_status: AccessStatus;
  last_processed?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface DocumentProcessingJob {
  id: number;
  document_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
  error_message?: string;
}
