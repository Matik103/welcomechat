
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
  onAdd: (data: WebsiteUrlFormData) => Promise<void>;
  onSubmit?: (data: WebsiteUrlFormData) => Promise<void>; // Added onSubmit property
  isAdding: boolean;
  isSubmitting?: boolean; // Added isSubmitting property
  agentName: string;
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
