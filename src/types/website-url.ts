
import { z } from 'zod';

// Define website URL schema for validation
export const websiteUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  refresh_rate: z.number().min(1, "Refresh rate is required").max(365, "Refresh rate cannot exceed 365 days"),
  client_id: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Extract type from schema
export type WebsiteUrlFormData = z.infer<typeof websiteUrlSchema>;

// Props interface for the WebsiteUrlForm component
export interface WebsiteUrlFormProps {
  onSubmit?: (data: WebsiteUrlFormData) => Promise<void>;
  onAdd?: (data: WebsiteUrlFormData) => Promise<void>;
  isSubmitting?: boolean;
  isAdding?: boolean;
  agentName?: string;
  clientId?: string;
  onAddSuccess?: () => Promise<void>;
  webstoreHook?: any;
}

// Interface for a WebsiteUrl
export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  refresh_rate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  last_crawled?: string | null;
  updated_at?: string;
  error?: string | null;
  metadata?: Record<string, any>;
  scrapable?: boolean;
  is_sitemap?: boolean;
  scrapability?: 'high' | 'medium' | 'low' | 'unknown';
}

export interface WebsiteUrlsListProps {
  urls: WebsiteUrl[];
  onDelete: (id: number) => Promise<void>;
  isDeleting?: boolean;
  deletingId?: number | null;
  onProcess?: (website: WebsiteUrl) => Promise<void>;
  isProcessing?: boolean;
}
