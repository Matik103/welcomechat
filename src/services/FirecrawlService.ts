
import { FirecrawlConfig, FirecrawlResponse } from '@/types/firecrawl';
import { getEffectiveApiKey, getBaseUrlFromEnv } from '@/utils/FirecrawlServiceUtils';

export interface ValidateUrlResponse {
  success: boolean;
  scrapable: boolean;
  data?: {
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
  };
  error?: string;
}

interface FirecrawlRequest {
  method: string;
  endpoint: string;
  body?: any;
}

export interface CrawlWebsiteParams {
  url: string;
  scrapeOptions?: {
    maxDepth?: number;
    maxPages?: number;
    ignoreSitemap?: boolean;
    ignoreQueryParameters?: boolean;
    allowBackwardLinks?: boolean;
    allowExternalLinks?: boolean;
    excludeTags?: string[];
    includeTags?: string[];
    removeBase64Images?: boolean;
    formats?: string[];
    onlyMainContent?: boolean;
    blockAds?: boolean;
    headers?: Record<string, string>;
    waitFor?: number;
    mobile?: boolean;
    skipTlsVerification?: boolean;
    timeout?: number;
    proxy?: 'basic' | 'residential' | 'datacenter';
  };
}

export interface CrawlStatusResponse {
  status: 'pending' | 'scraping' | 'completed' | 'failed';
  data?: Array<{
    url: string;
    markdown: string;
    metadata?: Record<string, any>;
  }>;
  totalPages?: number;
  completedPages?: number;
  creditsUsed?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface CrawlResponse {
  success: boolean;
  id: string;
  url: string;
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

export class FirecrawlService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: FirecrawlConfig) {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required');
    }
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  // Static method to get a pre-configured instance
  static getInstance(): FirecrawlService | null {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) {
      return null;
    }

    const baseUrl = getBaseUrlFromEnv();
    return new FirecrawlService({ apiKey, baseUrl });
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
  static async verifyFirecrawlConfig(apiKey?: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const effectiveApiKey = apiKey || getEffectiveApiKey();
      
      if (!effectiveApiKey) {
        return { success: false, error: 'Firecrawl API key is not configured' };
      }
      
      // For simple validation, we can just check if the API key exists
      // In a real-world scenario, you might want to make a test API call
      return { 
        success: true, 
        data: { message: 'Firecrawl API is configured properly' } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to verify Firecrawl configuration' 
      };
    }
  }

  // Static method for checking scrapability (for use when you don't have an instance)
  static async checkScrapability(url: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const instance = FirecrawlService.getInstance();
    if (!instance) {
      return { success: false, error: 'API key not configured' };
    }
    
    return instance.validateUrl(url);
  }

  // Static method for crawling websites (for use when you don't have an instance)
  static async crawlWebsite(params: CrawlWebsiteParams): Promise<{ success: boolean; data?: any; error?: string; id?: string }> {
    const instance = FirecrawlService.getInstance();
    if (!instance) {
      return { success: false, error: 'API key not configured' };
    }
    
    return instance.crawlWebsite(params);
  }

  // Static method for getting crawl status (for use when you don't have an instance)
  static async getCrawlStatus(crawlId: string): Promise<{ success: boolean; data?: any; error?: string; status?: string }> {
    const instance = FirecrawlService.getInstance();
    if (!instance) {
      return { success: false, error: 'API key not configured' };
    }
    
    return instance.getCrawlStatus(crawlId);
  }

  // Static method for getting crawl results (for use when you don't have an instance)
  static async getCrawlResults(crawlId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const instance = FirecrawlService.getInstance();
    if (!instance) {
      return { success: false, error: 'API key not configured' };
    }
    
    return instance.getCrawlResults(crawlId);
  }

  private async makeRequest<T>(request: FirecrawlRequest): Promise<T> {
    const { method, endpoint, body } = request;
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async validateUrl(url: string): Promise<ValidateUrlResponse> {
    try {
      // First validate URL format
      const formatValidation = FirecrawlService.validateUrl(url);
      if (!formatValidation.isValid) {
        return {
          success: false,
          scrapable: false,
          error: formatValidation.error
        };
      }

      const response = await this.makeRequest<ScrapabilityResponse>({
        method: 'POST',
        endpoint: '/scrape',
        body: { url }
      });

      if (!response.success) {
        return {
          success: false,
          scrapable: false,
          error: response.error || 'URL validation failed'
        };
      }

      return {
        success: true,
        scrapable: true,
        data: {
          title: response.data?.metadata.title,
          metadata: response.data?.metadata
        }
      };
    } catch (error) {
      return {
        success: false,
        scrapable: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async crawlWebsite(params: CrawlWebsiteParams): Promise<CrawlResponse> {
    return this.makeRequest<CrawlResponse>({
      method: 'POST',
      endpoint: '/crawl',
      body: params
    });
  }

  async getCrawlStatus(crawlId: string): Promise<CrawlStatusResponse> {
    return this.makeRequest<CrawlStatusResponse>({
      method: 'GET',
      endpoint: `/crawl/${crawlId}/status`
    });
  }

  async getCrawlResults(crawlId: string): Promise<CrawlResultsResponse> {
    return this.makeRequest<CrawlResultsResponse>({
      method: 'GET',
      endpoint: `/crawl/${crawlId}/results`
    });
  }
}
