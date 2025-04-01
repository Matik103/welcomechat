
export interface FirecrawlConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface CrawlWebsiteParams {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  onlyMainContent?: boolean;
  limit?: number;
}

export interface FirecrawlResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class FirecrawlService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: FirecrawlConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/api';
    
    // Check if API key is available
    if (!this.apiKey) {
      console.warn("Firecrawl API key not set! Please set FIRECRAWL_API_KEY environment variable.");
    }
  }

  async crawlWebsite(params: CrawlWebsiteParams): Promise<FirecrawlResponse<{jobId: string}>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Firecrawl API key not configured. Please set FIRECRAWL_API_KEY in environment variables.'
        };
      }
      
      console.log(`Firecrawl crawling request for URL: ${params.url}`);
      
      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: params.url,
          maxPages: params.maxPages || 50,
          maxDepth: params.maxDepth || 2,
          onlyMainContent: params.onlyMainContent !== false,
          limit: params.limit || 100
        })
      });

      if (!response.ok) {
        let errorMessage = `Failed to crawl website: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Could not parse error response as JSON:", e);
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const data = await response.json();
      console.log(`Firecrawl crawl job started with ID: ${data.jobId}`);
      
      return {
        success: true,
        data: {
          jobId: data.jobId
        }
      };
    } catch (error) {
      console.error("Firecrawl crawl error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getCrawlStatus(jobId: string): Promise<FirecrawlResponse<{status: string}>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Firecrawl API key not configured'
        };
      }
      
      console.log(`Checking status for Firecrawl job: ${jobId}`);
      
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get job status: ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log(`Firecrawl job ${jobId} status: ${data.status}`);
      
      return {
        success: true,
        data: {
          status: data.status
        }
      };
    } catch (error) {
      console.error("Error checking Firecrawl job status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getCrawlResults(jobId: string): Promise<FirecrawlResponse<{
    content: string;
    url: string;
    pages: number;
  }>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Firecrawl API key not configured'
        };
      }
      
      console.log(`Getting results for Firecrawl job: ${jobId}`);
      
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get job results: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Log truncated content for debugging
      console.log(`Firecrawl job ${jobId} results retrieved. Content sample: ${
        data.content ? data.content.substring(0, 100) + '...' : 'No content'
      }`);
      
      return {
        success: true,
        data: {
          content: data.content,
          url: data.url,
          pages: data.pages || 0
        }
      };
    } catch (error) {
      console.error("Error getting Firecrawl job results:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
