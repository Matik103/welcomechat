
import { Json } from "@/integrations/supabase/types";

export interface DocumentProcessingOptions {
  clientId: string;
  agentName?: string;
  documentType?: string;
  webhook?: string;
  maxPages?: number;
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
