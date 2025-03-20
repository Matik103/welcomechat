
import { Json } from "@/integrations/supabase/types";

export interface DocumentProcessingResult {
  success: boolean;
  status: 'completed' | 'processing' | 'failed';
  documentId?: string;
  error?: string;
  metadata?: Json;
  content?: string;
}

export interface DocumentProcessingOptions {
  processingMethod?: string;
  clientId: string;
  agentName?: string;
  onUploadProgress?: (progress: number) => void;
  metadata?: Json; // Added this missing property
}

export interface DocumentUploadFormProps {
  onSubmitDocument: (file: File) => Promise<void>;
  isUploading: boolean;
}

export interface DocumentLinksListProps {
  links: DocumentLink[];
  isLoading: boolean;
  onDelete: (id: number) => Promise<void>;
  isDeleteLoading?: boolean;
  deletingId?: number | null;
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

// Updated to make all properties required
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

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'granted' | 'pending' | 'denied';

// Updated DriveLinksProps to include isValidating
export interface DriveLinksProps {
  documents: DocumentLink[];
  isLoading: boolean;
  isUploading: boolean;
  isValidating?: boolean;
  addDocumentLink: (data: DocumentLinkFormData) => Promise<void>;
  deleteDocumentLink: (linkId: number) => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  isClientView?: boolean;
  deletingId?: number | null;
  isDeleteLoading?: boolean;
}
