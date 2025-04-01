
export interface LlamaParseServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ProcessDocumentOptions {
  url: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface LlamaParseResponse {
  status: "success" | "error";
  content?: string;
  metadata?: Record<string, any>;
  error?: string;
  jobId?: string;
}

export class LlamaParseService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LlamaParseServiceConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://cloud.llamaindex.ai/api/parse";
    
    // Verify API key is set
    if (!this.apiKey) {
      console.warn("LlamaParse API key not provided. Set LLAMA_CLOUD_API_KEY environment variable.");
    }
  }

  async processDocument(options: ProcessDocumentOptions): Promise<LlamaParseResponse> {
    try {
      if (!this.apiKey) {
        return {
          status: "error",
          error: "LlamaParse API key not configured. Please set LLAMA_CLOUD_API_KEY environment variable."
        };
      }
      
      const headers = {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      };
      
      // Log request for debugging
      console.log(`Requesting document processing for URL: ${options.url}`);
      
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: options.url,
          metadata: options.metadata || {},
          callback_url: options.callbackUrl
        })
      });
      
      if (!response.ok) {
        let errorText = await response.text();
        console.error(`LlamaParse API error (${response.status}): ${errorText}`);
        
        return {
          status: "error",
          error: `LlamaParse API error: ${response.status} ${response.statusText}. ${errorText}`
        };
      }
      
      const data = await response.json();
      
      if (data && data.success) {
        return {
          status: "success",
          content: data.content,
          metadata: data.metadata,
          jobId: data.job_id
        };
      } else {
        return {
          status: "error",
          error: data.error || "Unknown error processing document"
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("LlamaParse processing error:", errorMessage);
      
      return {
        status: "error",
        error: `LlamaParse error: ${errorMessage}`
      };
    }
  }

  async checkJobStatus(jobId: string): Promise<LlamaParseResponse> {
    try {
      if (!this.apiKey) {
        return {
          status: "error",
          error: "LlamaParse API key not configured"
        };
      }
      
      const jobStatusUrl = `${this.baseUrl}/jobs/${jobId}`;
      
      const response = await fetch(jobStatusUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        return {
          status: "error",
          error: `LlamaParse API error: ${response.status} ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      if (data.status === "completed") {
        return {
          status: "success",
          content: data.content,
          metadata: data.metadata
        };
      } else if (data.status === "failed") {
        return {
          status: "error",
          error: data.error || "Processing failed"
        };
      } else {
        return {
          status: "error",
          error: `Job status: ${data.status}`
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("LlamaParse status check error:", errorMessage);
      
      return {
        status: "error",
        error: `LlamaParse error: ${errorMessage}`
      };
    }
  }
}
