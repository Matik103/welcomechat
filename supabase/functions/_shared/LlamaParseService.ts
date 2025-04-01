
export interface LlamaParseConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface LlamaParseRequest {
  file?: File | string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface LlamaParseResponse {
  status: 'success' | 'error';
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export class LlamaParseService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LlamaParseConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.cloud.llamaindex.ai/api/parsing';
  }

  async processDocument(params: LlamaParseRequest): Promise<LlamaParseResponse> {
    try {
      let response;
      let body;

      // Handle URL-based documents (Google Drive, web links, etc.)
      if (params.url) {
        body = JSON.stringify({
          url: params.url,
          metadata: params.metadata || {}
        });

        response = await fetch(`${this.baseUrl}/url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body
        });
      } 
      // Handle direct file upload or storage URL processing
      else if (params.file) {
        // For string URLs, we pass them directly to the backend
        if (typeof params.file === 'string') {
          body = JSON.stringify({
            url: params.file,
            metadata: params.metadata || {}
          });

          response = await fetch(`${this.baseUrl}/url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body
          });
        } 
        // For actual File objects, we'd use FormData
        else {
          const formData = new FormData();
          formData.append('file', params.file);
          
          response = await fetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json'
            },
            body: formData
          });
        }
      } else {
        return {
          status: 'error',
          error: 'No file or URL provided for processing'
        };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return {
          status: 'error',
          error: errorData.message || `Failed to process document: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      return {
        status: 'success',
        content: data.content || data.text,
        metadata: data.metadata
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
