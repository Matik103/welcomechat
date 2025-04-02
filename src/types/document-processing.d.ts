
/**
 * Document processing type definitions
 */

export interface DocumentProcessingOptions {
  shouldExtractText?: boolean;
  shouldParsePDF?: boolean;
  shouldUseAI?: boolean;
  maxPages?: number;
}

export interface DocumentProcessingStatus {
  stage: 'uploading' | 'processing' | 'parsing' | 'analyzing' | 'complete' | 'failed';
  progress: number;
  message?: string;
  error?: Error | string;
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
