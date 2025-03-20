
import { Json } from "@/integrations/supabase/types";

export interface DocumentProcessingOptions {
  clientId: string;
  agentName?: string;
  documentType?: string;
  webhook?: string;
  maxPages?: number;
  processingMethod?: 'standard' | 'llamaparse' | 'openai';
  onUploadProgress?: (progress: number) => void;
}

export interface DocumentProcessingResult {
  success: boolean;
  status: string;
  documentId: string;
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
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
