
/**
 * Types for document processing functionality
 */

export interface DocumentProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'pending' | 'granted' | 'denied';

export interface DocumentLink {
  id: number;
  client_id: string;
  link: string;
  document_type: string;
  created_at: string;
  refresh_rate: number;
  notified_at?: string;
  access_status?: AccessStatus;
}

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type?: string;
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
