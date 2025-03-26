
export interface DocumentProcessingResult {
  success: boolean;
  error?: string | null;
  processed: number;
  failed: number;
  jobId?: string;
}

export interface DocumentProcessingJob {
  id: number;
  client_id: string;
  document_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
  processed_count: number;
  failed_count: number;
}

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  format: string;
}
