export interface DocumentContent {
  id: number;
  client_id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  created_at: string;
}

export interface FunctionMetrics {
  id: number;
  client_id: string;
  function_name: string;
  request_path: string;
  status_code: number;
  duration_ms?: number;
  error?: string;
  created_at: string;
}

export interface UploadRequest {
  client_id: string;
  file_name: string;
  file_data: string;
}

export interface QueryRequest {
  client_id: string;
  query: string;
}

export interface QueryResponse {
  answer: string;
  documents: Array<{
    content: string;
    similarity: number;
  }>;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
} 