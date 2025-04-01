
export interface FirecrawlConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ScrapabilityResponse {
  url: string;
  scrapability: string;
  statusCode?: number;
  contentType?: string;
  robotsAllowed?: boolean;
  metaAllowed?: boolean;
}

export interface CrawlOptions {
  url: string;
  maxDepth?: number;
  limit?: number;
  scrapeOptions?: {
    formats?: string[];
    onlyMainContent?: boolean;
    blockAds?: boolean;
  };
}

export interface StartCrawlResponse {
  id: string;
  url: string;
  status: string;
}

export interface CrawlStatus {
  status: string;
  progress?: {
    discovered: number;
    crawled: number;
  };
  error?: string;
}

export interface CrawlResults {
  id?: string;
  url?: string;
  total: number;
  completed: number;
  pages: any[]; // Can be defined more specifically if needed
  creditsUsed: number;
  expiresAt?: string;
}

export interface FirecrawlResponse {
  success: boolean;
  data?: any;
  error?: string;
  id?: string;
  status?: string;
}

// For URL checking responses
export interface UrlCheckResult {
  isAccessible: boolean;
  canScrape: boolean;
  hasScrapingRestrictions?: boolean;
  statusCode?: number;
  contentType?: string;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
  content?: string;
  error?: string;
}

export type CrawlResultsResponse = {
  id?: string;
  url?: string;
  total: number;
  completed: number;
  pages: any[];
  creditsUsed: number;
};

export type CrawlStatusResponse = {
  success: boolean;
  status: string;
  progress?: {
    discovered: number;
    crawled: number;
  };
  error?: string;
};
