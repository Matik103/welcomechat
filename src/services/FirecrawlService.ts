import { FirecrawlConfig, FirecrawlResponse } from '@/types/firecrawl.js';
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

  // Validate URL format
  static validateUrlFormat(url: string): { isValid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
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
      const formatValidation = FirecrawlService.validateUrlFormat(url);
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
