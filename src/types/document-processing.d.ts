
/**
 * Document processing type definitions
 */

export interface DocumentProcessingOptions {
  shouldExtractText?: boolean;
  shouldParsePDF?: boolean;
  shouldUseAI?: boolean;
  maxPages?: number;
  syncToAgent?: boolean;
  syncToProfile?: boolean;
  syncToWidgetSettings?: boolean;
  folder?: string;
  description?: string;
  clientId: string;
  documentType?: string;
  agentName?: string;
}

export interface DocumentProcessingStatus {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  id?: string;
  error?: string | Error;
  stage: 'uploading' | 'processing' | 'parsing' | 'analyzing' | 'complete' | 'failed';
  progress: number;
  message?: string;
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

export interface LlamaIndexProcessingOptions {
  shouldUseAI?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface LlamaIndexJobResponse {
  job_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  error?: string;
}

export interface LlamaIndexParsingResult {
  job_id: string;
  status: 'SUCCEEDED' | 'FAILED';
  parsed_content?: string;
  error?: string;
  document_chunks?: LlamaIndexDocumentChunk[];
}

export interface LlamaIndexDocumentChunk {
  text: string;
  metadata?: {
    page_number?: number;
    source?: string;
    [key: string]: any;
  };
}

export interface DocumentType {
  type: 'pdf' | 'text' | 'google_doc' | 'google_drive' | 'docx' | 'html' | 'url' | 'web_page';
}

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
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

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'pending' | 'granted' | 'denied';
