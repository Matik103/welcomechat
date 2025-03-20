
// Types for Llama Parse API integration

export interface LlamaParseConfig {
  apiKey: string;
  endpoint: string;
}

export interface LlamaParseRequest {
  file: File | Blob;
  mimeType?: string;
  fileName?: string;
  options?: {
    verbose?: boolean;
    language?: string;
    outputFormat?: "json" | "markdown" | "text";
  };
}

export interface LlamaParseResponse {
  id: string;
  status: "success" | "processing" | "failed";
  data?: {
    content: string;
    metadata: {
      title?: string;
      author?: string;
      createdAt?: string;
      pages?: number;
      words?: number;
    };
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface DocumentProcessingResult {
  status: "success" | "failed";
  documentId?: string;
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
}
