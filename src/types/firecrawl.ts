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