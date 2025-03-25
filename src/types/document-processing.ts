import { Json } from "@/integrations/supabase/types";

export interface DocumentProcessingOptions {
  clientId: string;
  agentName: string;
  onUploadProgress?: (progress: number) => void;
  processingMethod?: 'llamaparse' | 'firecrawl' | 'manual';
}

export interface DocumentChunk {
  id: string;
  content: string;
  length: number;
  metadata: Json;
}

export interface DocumentMetadata {
  path: string;
  processedAt: string;
  method: string;
  publicUrl: string;
  title?: string;
  author?: string;
  createdAt?: string;
  pageCount?: number;
  totalChunks: number;
  characterCount: number;
  wordCount: number;
  averageChunkSize: number;
  language?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: any;
}

export type DocumentProcessingStatus = 'none' | 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentProcessingResult {
  success?: boolean;
  status: DocumentProcessingStatus;
  documentId?: string;
  documentUrl: string;
  documentType: string;
  clientId: string;
  agentName: string;
  startedAt: string;
  completedAt?: string;
  chunks: DocumentChunk[];
  content?: string;
  error?: string;
  metadata: DocumentMetadata;
}

export interface ParseResponse {
  success: boolean;
  content?: string;
  data?: any;
  metadata?: {
    title?: string;
    author?: string;
    createdAt?: string;
    pageCount?: number;
    language?: string;
    [key: string]: any;
  };
  error?: string;
  errorDetails?: {
    code: string;
    details?: any;
  };
  documentId?: string;
  jobId?: string;
}

export interface DocumentLinkFormData {
  document_type: "text" | "google_doc" | "google_sheet" | "google_drive" | "pdf" | "other";
  link: string;
  refresh_rate: number;
}

export interface DocumentUploadFormData {
  document_type: "text" | "pdf" | "other";
  file: File;
}

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  error?: string;
  details?: {
    scrapability?: 'high' | 'medium' | 'low';
    contentType?: string;
    statusCode?: number;
    pageSize?: string;
    estimatedTokens?: number;
  };
  status?: string;
}

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'granted' | 'pending' | 'denied';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  created_at: string;
  document_type: string;
  access_status?: AccessStatus;
  notified_at?: string;
}

export interface DriveLinksProps {
  documents: DocumentLink[];
  isLoading: boolean;
  isUploading: boolean;
  addDocumentLink: (data: DocumentLinkFormData) => Promise<void>;
  deleteDocumentLink: (linkId: number) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  isClientView?: boolean;
  isValidating?: boolean;
  deletingId?: number | null;
  isDeleteLoading?: boolean;
}

export interface DocumentLinkFormProps {
  onSubmit: (data: DocumentLinkFormData) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  agentName?: string;
}
