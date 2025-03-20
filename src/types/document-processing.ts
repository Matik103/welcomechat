
import { Json } from "@/integrations/supabase/types";

export interface DocumentProcessingResult {
  success: boolean;
  status: 'completed' | 'processing' | 'failed';
  documentId?: string;
  error?: string;
  metadata?: Json;
  content?: string; // Added to fix useDocumentProcessor error
}

export interface DocumentProcessingOptions {
  processingMethod?: string;
  clientId: string;
  agentName?: string;
  onUploadProgress?: (progress: number) => void;
}

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
}

export interface DocumentLinksListProps {
  documentLinks: DocumentLink[];
  isLoading: boolean;
  onDelete: (linkId: number) => Promise<void>;
}

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: string;
  refresh_rate: number;
  access_status?: string;
  notified_at?: string;
  created_at: string;
}

export interface DocumentLinkFormData {
  link: string;
  document_type: string;
  refresh_rate: number;
}

export interface AgentNameWarningProps {
  show: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  status?: 'success' | 'error' | 'warning' | 'info' | 'pending';
}

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown';
