
import { z } from 'zod';

// Define website URL schema for validation
export const websiteUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
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
}

// Interface for a WebsiteUrl
export interface WebsiteUrl {
  id: number;
  client_id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  scrapable?: boolean;
  is_sitemap?: boolean;
}
