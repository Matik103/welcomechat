
import { CrawlOptions, FirecrawlConfig, ScrapabilityResponse, StartCrawlResponse, CrawlStatus, CrawlResults } from '@/types/firecrawl';

export class FirecrawlService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: FirecrawlConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v1';
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: string = 'GET', 
    data?: any
  ): Promise<{ success: boolean; data?: T; error?: string; id?: string }> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      const options: RequestInit = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      };

      console.log(`Making ${method} request to ${url}`);
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        console.error('API request failed:', responseData);
        return { 
          success: false, 
          error: responseData.error || `Request failed with status ${response.status}` 
        };
      }

      return { success: true, data: responseData, id: responseData.id };
    } catch (error) {
      console.error('Error in FirecrawlService:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Check if a URL is scrapable
   */
  async checkScrapability(url: string): Promise<{ 
    success: boolean; 
    data?: ScrapabilityResponse; 
    error?: string 
  }> {
    return this.makeRequest<ScrapabilityResponse>('/scrapability', 'POST', { url });
  }

  /**
   * Start a website crawl
   */
  async crawlWebsite(options: CrawlOptions): Promise<{ 
    success: boolean; 
    id?: string; 
    error?: string 
  }> {
    const result = await this.makeRequest<StartCrawlResponse>('/crawl', 'POST', options);
    return result;
  }

  /**
   * Get the status of a crawl
   */
  async getCrawlStatus(crawlId: string): Promise<CrawlStatus> {
    const result = await this.makeRequest<CrawlStatus>(`/crawl/${crawlId}/status`);
    return result.data || { 
      status: 'failed', 
      error: result.error || 'Failed to get crawl status' 
    };
  }

  /**
   * Get the results of a completed crawl
   */
  async getCrawlResults(crawlId: string): Promise<CrawlResults> {
    const result = await this.makeRequest<CrawlResults>(`/crawl/${crawlId}/results`);
    return result.data || { 
      total: 0, 
      completed: 0, 
      pages: [], 
      creditsUsed: 0 
    };
  }
}
