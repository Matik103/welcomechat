
export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  refresh_rate: number;
  created_at: string;
  updated_at?: string;
  last_crawled?: string;
  status?: string;
  error?: string | null;
  metadata?: Record<string, any>;
}

export interface WebsiteUrlFormData {
  url: string;
  refresh_rate: number;
  client_id?: string;
  metadata?: Record<string, any>;
}
