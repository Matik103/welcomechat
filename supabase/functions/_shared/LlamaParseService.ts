
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
    
    // Check if API key is available
    if (!this.apiKey) {
      console.warn("LlamaParse API key not set! Please set LLAMA_CLOUD_API_KEY environment variable.");
    }
  }

  async processDocument(params: LlamaParseRequest): Promise<LlamaParseResponse> {
    try {
      // Verify API key is set
      if (!this.apiKey) {
        return {
          status: 'error',
          error: 'LlamaParse API key not configured. Please set LLAMA_CLOUD_API_KEY in environment variables.'
        };
      }
      
      // Log the request
      console.log(`LlamaParse processing request:`, { 
        hasUrl: !!params.url, 
        hasFile: !!params.file, 
        hasMetadata: !!params.metadata,
        fileType: typeof params.file === 'string' ? 'url' : (params.file instanceof File ? 'File object' : null)
      });

      let response;
      let body;

      // Handle URL-based documents (Google Drive, web links, etc.)
      if (params.url) {
        console.log(`Processing URL: ${maskUrl(params.url)}`);
        
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
          console.log(`Processing file URL: ${maskUrl(params.file)}`);
          
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
          console.log(`Processing file object named: ${params.file.name}, size: ${params.file.size} bytes`);
          
          const formData = new FormData();
          formData.append('file', params.file);
          
          if (params.metadata) {
            formData.append('metadata', JSON.stringify(params.metadata));
          }
          
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

      // Check response
      if (!response) {
        return {
          status: 'error',
          error: 'No response received from LlamaParse API'
        };
      }
      
      console.log(`LlamaParse response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = `Failed to process document: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("LlamaParse error data:", errorData);
        } catch (e) {
          console.error("Could not parse error response as JSON:", e);
        }
        
        return {
          status: 'error',
          error: errorMessage
        };
      }

      // Parse successful response
      try {
        const data = await response.json();
        
        // Log truncated content for debugging
        const contentSample = data.content || data.text;
        console.log(`LlamaParse processed document successfully. Content sample: ${
          contentSample ? contentSample.substring(0, 100) + '...' : 'No content returned'
        }`);
        
        return {
          status: 'success',
          content: data.content || data.text,
          metadata: data.metadata
        };
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        return {
          status: 'error',
          error: 'Failed to parse LlamaParse API response'
        };
      }
    } catch (error) {
      console.error("LlamaParse processing error:", error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Helper function to mask sensitive parts of URLs for logging
function maskUrl(url: string): string {
  try {
    // Don't mask URLs that don't have query params
    if (!url.includes('?')) {
      return url;
    }
    
    const urlObj = new URL(url);
    
    // Create a copy of searchParams so we can modify it
    const maskedParams = new URLSearchParams();
    
    // For each parameter, mask the value if it looks like it could be sensitive
    for (const [key, value] of urlObj.searchParams.entries()) {
      const sensitiveKeys = ['key', 'token', 'auth', 'password', 'secret', 'credential', 'access', 'api'];
      const isSensitive = sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
      
      if (isSensitive && value.length > 4) {
        // Mask middle of the value
        const start = value.substring(0, 3);
        const end = value.substring(value.length - 3);
        maskedParams.set(key, `${start}...${end}`);
      } else {
        maskedParams.set(key, value);
      }
    }
    
    // Reconstruct the URL with masked parameters
    return `${urlObj.origin}${urlObj.pathname}?${maskedParams.toString()}`;
  } catch (e) {
    console.error("Error masking URL:", e);
    return "[Error masking URL]";
  }
}
