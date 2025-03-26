
export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  refresh_rate: number;
  created_at: string;
  updated_at: string | null;
  last_processed?: string | null;
  status?: string;
}

export interface WebsiteUrlFormData {
  url: string;
  refresh_rate: number;
}
