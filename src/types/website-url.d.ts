
export interface WebsiteUrl {
  id: number;
  url: string;
  client_id: string;
  created_at: string;
  last_crawled?: string | null;
  refresh_rate: number;
  status?: string;
  notified_at?: string;
  scrapability?: 'high' | 'medium' | 'low' | 'unknown';
  updated_at?: string;
  error?: string;
  scrapable?: boolean;
  is_sitemap?: boolean;
}

export interface WebsiteUrlFormData {
  url: string;
  refresh_rate: number;
  client_id?: string;
  id?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  created_at?: string;
  scrapable?: boolean;
  is_sitemap?: boolean;
}

export interface WebsiteUrlFormProps {
  onAdd?: (data: WebsiteUrlFormData) => Promise<void>;
  onSubmit?: (data: WebsiteUrlFormData) => Promise<void>;
  isAdding?: boolean;
  isSubmitting?: boolean;
  agentName?: string;
  clientId?: string;
  onAddSuccess?: () => Promise<void>;
  webstoreHook?: any;
}

export interface WebsiteUrlsListProps {
  urls: WebsiteUrl[];
  onDelete: (id: number) => Promise<void>;
  isDeleting?: boolean;
  deletingId?: number | null;
  onProcess?: (website: WebsiteUrl) => Promise<void>;
  isProcessing?: boolean;
  isDeleteLoading?: boolean;
  deletingUrlId?: number;
}
