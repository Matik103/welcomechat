
export type DocumentType = 
  | 'document' 
  | 'google_drive' 
  | 'pdf'
  | 'spreadsheet'
  | 'text'
  | 'web_page'
  | 'unknown';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  document_type: DocumentType;
  created_at: string;
  storage_path?: string;
  access_status?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
}

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  processed: number;
  failed: number;
  error?: string;
  status?: string;
  jobId?: string | number;
  documentId?: string;
  documentUrl?: string;
  extractedText?: string;
}
