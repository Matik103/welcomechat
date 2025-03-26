export interface WebsiteUrl {
  id: string;
  client_id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  last_crawled: string | null;
  refresh_rate: number;
  created_at: string;
  error: string | null;
}

export interface WebsiteUrlFormData {
  url: string;
  refresh_rate: number;
}
