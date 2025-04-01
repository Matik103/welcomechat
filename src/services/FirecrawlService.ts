
import { CrawlOptions, FirecrawlConfig, ScrapabilityResponse, StartCrawlResponse, CrawlStatus, CrawlResults } from '@/types/firecrawl';
import { getEffectiveApiKey, getBaseUrlFromEnv } from '@/utils/FirecrawlServiceUtils';

export class FirecrawlService {
  private static apiKey: string;
  private static baseUrl: string;

  // Initialize the service with the current available API key
  private static initialize() {
    this.apiKey = getEffectiveApiKey() || '';
    this.baseUrl = getBaseUrlFromEnv();
  }

  // Validate URL format
  static validateUrl(url: string): { isValid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  // Verify Firecrawl configuration
  static async verifyFirecrawlConfig(apiKeyOverride?: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      this.initialize();
      
      const effectiveApiKey = apiKeyOverride || this.apiKey;
      
      if (!effectiveApiKey) {
        return { success: false, error: 'Firecrawl API key is not configured' };
      }
      
      // Make a simple API call to verify the key
      const endpoint = '/scrapability';
      const url = `${this.baseUrl}${endpoint}`;
      
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify({ url: 'https://example.com' })
      };
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || `API returned ${response.status} status`
        };
      }
      
      // If we got here, the API key is valid
      if (apiKeyOverride) {
        // If we were testing a new key, store it now
        localStorage.setItem('firecrawl_api_key', apiKeyOverride);
        this.apiKey = apiKeyOverride;
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to verify Firecrawl configuration' 
      };
    }
  }

  private static async makeRequest<T>(
    endpoint: string, 
    method: string = 'GET', 
    data?: any
  ): Promise<{ success: boolean; data?: T; error?: string; id?: string }> {
    try {
      this.initialize();
      
      if (!this.apiKey) {
        return { 
          success: false, 
          error: 'Firecrawl API key is not configured' 
        };
      }
      
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
  static async checkScrapability(url: string): Promise<{ 
    success: boolean; 
    data?: ScrapabilityResponse; 
    error?: string 
  }> {
    return this.makeRequest<ScrapabilityResponse>('/scrapability', 'POST', { url });
  }

  /**
   * Start a website crawl
   */
  static async crawlWebsite(options: CrawlOptions): Promise<{ 
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
  static async getCrawlStatus(crawlId: string): Promise<CrawlStatus> {
    const result = await this.makeRequest<CrawlStatus>(`/crawl/${crawlId}/status`);
    return result.data || { 
      status: 'failed', 
      error: result.error || 'Failed to get crawl status' 
    };
  }

  /**
   * Get the results of a completed crawl
   */
  static async getCrawlResults(crawlId: string): Promise<CrawlResults> {
    const result = await this.makeRequest<CrawlResults>(`/crawl/${crawlId}/results`);
    return result.data || { 
      total: 0, 
      completed: 0, 
      pages: [], 
      creditsUsed: 0 
    };
  }
}
