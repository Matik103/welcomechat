
export interface DocumentProcessingResult {
  success: boolean;
  processed?: number;
  failed?: number;
  error?: string;
  jobId?: string;
  documentId?: string;
  documentUrl?: string;
  status?: string;
  extractedText?: string;
}

export type DocumentType = 'pdf' | 'document' | 'website' | 'spreadsheet' | 'presentation';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: DocumentType;
  refresh_rate?: number;
  file_name?: string;
  storage_path?: string;
  mime_type?: string;
  created_at: string;
  updated_at?: string;
  access_status?: string;
  last_accessed?: string;
  metadata?: Record<string, any>;
}

export interface DocumentUploadSyncOptions {
  syncToAgent?: boolean;
  syncToProfile?: boolean;
  syncToWidgetSettings?: boolean;
  activityMessage?: string;
}

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File, options?: DocumentUploadSyncOptions) => Promise<void>;
  isUploading: boolean;
  syncOptions?: DocumentUploadSyncOptions;
}
