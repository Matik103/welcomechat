import { FirecrawlConfig, FirecrawlRequest, FirecrawlResponse } from '@/types/firecrawl';

interface CrawlWebsiteParams {
  url: string;
  maxDepth?: number;
  maxDiscoveryDepth?: number;
  limit?: number;
  ignoreSitemap?: boolean;
  ignoreQueryParameters?: boolean;
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
  scrapeOptions?: {
    formats?: string[];
  onlyMainContent?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
    headers?: Record<string, string>;
    waitFor?: number;
    mobile?: boolean;
    skipTlsVerification?: boolean;
    timeout?: number;
    removeBase64Images?: boolean;
    blockAds?: boolean;
    proxy?: 'basic' | 'stealth';
  };
}

interface CrawlResponse {
  success: boolean;
  id: string;
  url: string;
  error?: string;
}

interface CrawlStatusResponse {
  status: 'scraping' | 'completed' | 'failed';
  total: number;
  completed: number;
  creditsUsed: number;
  expiresAt: string;
  next?: string;
  data: Array<{
    markdown: string;
    html?: string;
    metadata: {
      title: string;
      description?: string;
      language?: string;
      sourceURL: string;
      statusCode: number;
      error?: string;
    };
  }>;
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

interface ScrapabilityResponse {
  success: boolean;
  data?: {
    markdown: string;
    metadata: {
      viewport?: string;
      title: string;
      scrapeId: string;
      sourceURL: string;
      url: string;
      statusCode: number;
    };
  };
  error?: string;
}

interface ValidateUrlResponse {
  isValid: boolean;
  error?: string;
}

export class FirecrawlService {
  private config: FirecrawlConfig;
  private baseUrl: string;

  constructor(config: FirecrawlConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v1';
  }

  private async makeRequest<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async crawlWebsite(params: CrawlWebsiteParams): Promise<CrawlResponse> {
    try {
      const requestBody = {
          url: params.url,
        maxDepth: params.maxDepth || 10,
        maxDiscoveryDepth: params.maxDiscoveryDepth,
        limit: params.limit || 10000,
        ignoreSitemap: params.ignoreSitemap || false,
        ignoreQueryParameters: params.ignoreQueryParameters || false,
        allowBackwardLinks: params.allowBackwardLinks || false,
        allowExternalLinks: params.allowExternalLinks || false,
        scrapeOptions: {
          formats: params.scrapeOptions?.formats || ['markdown'],
          onlyMainContent: params.scrapeOptions?.onlyMainContent ?? true,
          includeTags: params.scrapeOptions?.includeTags,
          excludeTags: params.scrapeOptions?.excludeTags,
          headers: params.scrapeOptions?.headers,
          waitFor: params.scrapeOptions?.waitFor,
          mobile: params.scrapeOptions?.mobile,
          skipTlsVerification: params.scrapeOptions?.skipTlsVerification,
          timeout: params.scrapeOptions?.timeout,
          removeBase64Images: params.scrapeOptions?.removeBase64Images,
          blockAds: params.scrapeOptions?.blockAds ?? true,
          proxy: params.scrapeOptions?.proxy
        }
      };

      const response = await this.makeRequest<CrawlResponse>('/crawl', 'POST', requestBody);
      return response;
    } catch (error) {
      return {
        success: false,
        id: '',
        url: params.url,
        error: error instanceof Error ? error.message : 'Failed to start crawl'
      };
    }
  }

  async getCrawlStatus(jobId: string): Promise<CrawlStatusResponse> {
    try {
      const response = await this.makeRequest<CrawlStatusResponse>(`/crawl/${jobId}`);
      return response;
    } catch (error) {
      throw new Error(`Failed to get crawl status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCrawlResults(jobId: string): Promise<CrawlStatusResponse> {
    return this.getCrawlStatus(jobId);
  }

  async cancelCrawl(jobId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/crawl/${jobId}/cancel`, 'POST');
      return true;
    } catch (error) {
      console.error('Error canceling crawl:', error);
      return false;
    }
  }

  async validateUrl(url: string): Promise<ValidateUrlResponse> {
    try {
      const data = await this.makeRequest<ValidateUrlResponse>('/validate', 'POST', { url });
      return data;
    } catch (error) {
      console.error('Error validating URL:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async checkScrapability(url: string): Promise<ScrapabilityResponse> {
    try {
      const response = await this.makeRequest<ScrapabilityResponse>('/scrape', 'POST', { url });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check scrapability'
      };
    }
  }
} 