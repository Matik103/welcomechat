
/**
 * Types for website URLs used in the client section
 */

export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  refresh_rate: number;
  created_at: string;
  updated_at?: string;
  last_scraped_at?: string;
  error?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  scrapability?: 'high' | 'medium' | 'low' | 'unknown';
}

export interface WebsiteUrlFormData {
  url: string;
  refresh_rate: number;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: {
    scrapability?: 'high' | 'medium' | 'low';
    contentType?: string;
    statusCode?: number;
    pageSize?: string;
    estimatedTokens?: number;
  };
}

// Updated WebsiteUrlsProps interface with all required properties
export interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  isLoading: boolean;
  onAdd: (data: { url: string; refresh_rate: number; }) => Promise<void>;
  onDelete: (urlId: number) => Promise<void>;
  isClientView?: boolean;
  isAdding?: boolean;
  isDeleting?: boolean;
  agentName?: string;
  addWebsiteUrl?: (data: { url: string; refresh_rate: number; }) => Promise<void>;
  deleteWebsiteUrl?: (urlId: number) => Promise<void>;
}
