export interface AIAgent {
  id: string;
  client_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  content: string;
  metadata: {
    source: string;
    document_type: string;
    processing_metadata: {
      credits_used: number;
      job_credits_usage: number;
      job_pages: number;
      job_auto_mode_triggered_pages: number;
      job_is_cache_hit: boolean;
      credits_max: number;
    };
  };
  status?: string;
  assistant_id?: string;
  agent_description?: string;
  embedding?: any;
  url?: string;
  interaction_type?: string;
  query_text?: string;
  response_time_ms?: number;
  is_error?: boolean;
  error_type?: string;
  error_message?: string;
  error_status?: string;
}

export interface DocumentProcessingJob {
  id: string;
  client_id: string;
  agent_name: string;
  document_id: string;
  document_type: string;
  document_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: {
    credits_used: number;
    pages_processed: number;
    cache_hit: boolean;
  };
  content?: string;
  error_message?: string;
  processing_method?: string;
  error?: string;
}

export interface DatabaseService {
  saveAgent(agent: Omit<AIAgent, 'id'>): Promise<AIAgent>;
  saveDocumentProcessingJob(job: Omit<DocumentProcessingJob, 'id'>): Promise<DocumentProcessingJob>;
  getAgent(id: string): Promise<AIAgent | null>;
  getDocumentProcessingJob(id: string): Promise<DocumentProcessingJob | null>;
} 