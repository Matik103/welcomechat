
export type AccessStatus = 'granted' | 'denied' | 'pending' | 'error';

export interface DocumentProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface DocumentProcessingResult {
  chunks: Array<{
    content: string;
    metadata: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface DocumentLinkFormData {
  link: string;
  refresh_rate: number;
  document_type?: string;
}
