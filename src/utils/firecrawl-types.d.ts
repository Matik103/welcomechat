
/**
 * Types for Firecrawl service
 */

export interface CrawlWebsiteParams {
  url: string;
  refresh_rate: number;
  metadata?: Record<string, any>;
  client_id?: string;
  maxDepth?: number;
  limit?: number;
  isSitemap?: boolean;
}

export interface CrawlResponse {
  success: boolean;
  job_id?: string;
  error?: string;
  data?: Array<{
    url: string;
    markdown: string;
    metadata?: Record<string, any>;
  }>;
}

export interface CrawlStatusResponse {
  success: boolean;
  status?: string;
  completed?: boolean;
  error?: string;
  data?: Array<{
    url: string;
    markdown: string;
    metadata?: Record<string, any>;
  }>;
}

export interface CrawlResultsResponse {
  success: boolean;
  results?: Array<{
    url: string;
    markdown: string;
    metadata?: Record<string, any>;
  }>;
  total?: number;
  completed?: number;
  creditsUsed?: number;
  error?: string;
}

export interface CheckScrapabilityParams {
  url: string;
}

export interface CheckScrapabilityResponse {
  success: boolean;
  data?: {
    canScrape: boolean;
    isAccessible?: boolean;
    hasScrapingRestrictions?: boolean;
    statusCode?: number;
    contentType?: string;
    robotsRestrictions?: string[];
    metaRestrictions?: string[];
    content?: string;
  };
  error?: string;
}

export interface ValidateUrlParams {
  url: string;
}

export interface ValidateUrlResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    normalizedUrl?: string;
  };
  error?: string;
}

export interface CrawlerStatus {
  url: string;
  status: string;
  processed: number;
  totalUrls: number;
  pending: number;
  errors: number;
  success: boolean;
  completed: boolean;
  job_id: string;
}

export interface UrlCheckResult {
  canScrape: boolean;
  isAccessible: boolean;
  hasScrapingRestrictions?: boolean;
  statusCode?: number;
  contentType?: string;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
  content?: string;
  error?: string;
}
