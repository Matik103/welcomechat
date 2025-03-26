
export type DocumentType = 'document' | 'google_drive' | 'google_sheet' | 'web_page';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: DocumentType;
  refresh_rate: number;
  created_at: string;
  updated_at: string | null;
  access_status?: string | null;
  last_processed?: string | null;
  status?: string | null;
}

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type?: DocumentType;
}

export interface DocumentProcessingResult {
  success: boolean;
  error?: string | null;
  processed: number;
  failed: number;
  jobId?: string;
}

export interface DocumentUploadFormData {
  file: File;
}
