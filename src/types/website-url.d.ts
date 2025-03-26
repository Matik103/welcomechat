
export interface WebsiteUrl {
  id: number;
  url: string;
  client_id: string;
  created_at: string;
  last_crawled?: string | null;
  refresh_rate: number;
  status?: string;
  notified_at?: string;
}

export interface WebsiteUrlFormData {
  url: string;
  refresh_rate: number;
}

export interface WebsiteUrlFormProps {
  onSubmit: (data: WebsiteUrlFormData) => Promise<void>;
  onAdd?: (data: WebsiteUrlFormData) => Promise<void>;
  isSubmitting?: boolean;
  isAdding?: boolean;
  agentName: string;
}

export interface WebsiteUrlsListProps {
  urls: WebsiteUrl[];
  onDelete: (id: number) => Promise<void>;
  isDeleting?: boolean;
  deletingId?: number;
  onProcess?: (website: WebsiteUrl) => Promise<void>;
  isProcessing?: boolean;
}
