
import { z } from 'zod';

// Define website URL schema for validation
export const websiteUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  refresh_rate: z.number().min(1, "Refresh rate is required").max(365, "Refresh rate cannot exceed 365 days"),
  client_id: z.string().optional(),
  id: z.number().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  created_at: z.string().optional(),
  scrapable: z.boolean().optional(),
  is_sitemap: z.boolean().optional()
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
  scrapable?: boolean;
  is_sitemap?: boolean;
  scrapability?: 'high' | 'medium' | 'low' | 'unknown';
  updated_at?: string;
  error?: string;
}
