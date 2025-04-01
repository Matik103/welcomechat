
export interface FirecrawlConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface FirecrawlRequest {
  url: string;
  maxDepth?: number;
  limit?: number;
  formats?: string[];
  onlyMainContent?: boolean;
  followLinks?: boolean;
  respectRobotsTxt?: boolean;
  waitForSelector?: string;
  timeout?: number;
}

export interface FirecrawlResponse {
  success: boolean;
  error?: string;
  data?: {
    jobId: string;
    status: string;
    url: string;
    pages?: number;
    errors?: string[];
    content?: string;
    metadata?: Record<string, any>;
    options?: FirecrawlRequest;
  };
}

export class FirecrawlService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: FirecrawlConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v1';
  }

  /**
   * Crawl a website and extract content
   */
  async crawlWebsite(request: FirecrawlRequest): Promise<FirecrawlResponse> {
    try {
      // Configure the options for the crawl
      const options = {
        url: request.url,
        max_depth: request.maxDepth || 2,
        limit: request.limit || 100,
        formats: request.formats || ['text'],
        only_main_content: request.onlyMainContent !== false,
        follow_links: request.followLinks !== false,
        respect_robots_txt: request.respectRobotsTxt !== false
      };

      // Start the crawl
      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `Failed to start crawl: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          jobId: data.job_id,
          status: data.status,
          url: request.url,
          options: request
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check the status of a crawl job
   */
  async getCrawlStatus(jobId: string): Promise<FirecrawlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `Failed to get job status: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          jobId: jobId,
          status: data.status,
          url: data.url,
          pages: data.pages_crawled,
          errors: data.errors
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get results from a completed crawl
   */
  async getCrawlResults(jobId: string): Promise<FirecrawlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || `Failed to get results: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Combine all page content
      let combinedContent = '';
      if (data.pages && Array.isArray(data.pages)) {
        combinedContent = data.pages
          .map((page: any) => {
            return `# ${page.title || 'Untitled Page'}\n\n${page.content || ''}\n\n`;
          })
          .join('\n');
      }
      
      return {
        success: true,
        data: {
          jobId: jobId,
          status: 'completed',
          url: data.url,
          pages: data.pages ? data.pages.length : 0,
          content: combinedContent,
          metadata: {
            pages_crawled: data.pages ? data.pages.length : 0,
            url: data.url,
            job_id: jobId
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
