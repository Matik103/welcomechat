import { FirecrawlConfig, FirecrawlRequest, FirecrawlResponse } from '@/types/firecrawl';

interface CrawlWebsiteParams {
  url: string;
  maxDepth?: number;
  limit?: number;
  onlyMainContent?: boolean;
}

interface CrawlStatusResponse {
  success: boolean;
  data?: {
    status: "pending" | "processing" | "completed" | "failed";
    jobId: string;
    error?: string;
  };
  error?: string;
}

interface CrawlResultsResponse {
  success: boolean;
  data?: {
    content: string;
    pages: number;
    url: string;
  };
  error?: string;
}

export class FirecrawlService {
  private config: FirecrawlConfig;
  private baseUrl: string;

  constructor(config: FirecrawlConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v1';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Firecrawl API request failed');
    }

    return response.json();
  }

  async crawlWebsite(params: CrawlWebsiteParams): Promise<CrawlStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: params.url,
          maxDepth: params.maxDepth || 2,
          limit: params.limit || 100,
          onlyMainContent: params.onlyMainContent ?? true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to start crawl",
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: {
          status: "pending",
          jobId: result.jobId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      };
    }
  }

  async getCrawlStatus(jobId: string): Promise<CrawlStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/crawl/${jobId}/status`, {
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to get crawl status",
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: {
          status: result.status,
          jobId: result.jobId,
          error: result.error,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      };
    }
  }

  async getCrawlResults(jobId: string): Promise<CrawlResultsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/crawl/${jobId}/results`, {
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to get crawl results",
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: {
          content: result.content,
          pages: result.pages,
          url: result.url,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      };
    }
  }

  async cancelCrawl(jobId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/crawl/${jobId}/cancel`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Error canceling crawl:', error);
      return false;
    }
  }

  async validateUrl(url: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const data = await this.makeRequest('/validate', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });

      return {
        isValid: data.isValid,
        error: data.error,
      };
    } catch (error) {
      console.error('Error validating URL:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async checkScrapability(url: string): Promise<{
    scrapable: boolean;
    reason?: string;
    metadata?: Record<string, any>;
  }> {
    try {
      const data = await this.makeRequest('/scrapability', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });

      return {
        scrapable: data.scrapable,
        reason: data.reason,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Error checking scrapability:', error);
      return {
        scrapable: false,
        reason: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
} 