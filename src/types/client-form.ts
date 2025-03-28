
import { z } from 'zod';

export type ActivityType = 
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_updated'
  | 'website_url_added'
  | 'url_deleted'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_added'
  | 'document_removed'
  | 'document_processed'
  | 'system_update'
  | 'webhook_sent'
  | 'error_logged'
  | 'chat_interaction';

// Define the structure for widget settings
export interface WidgetSettings {
  agent_name: string;
  agent_description?: string;
  initial_message?: string;
  placement?: string;
  primary_color?: string;
  font_family?: string;
  logo_url?: string;
  logo_storage_path?: string;
  [key: string]: any;
}

// Default widget settings
export const defaultSettings: WidgetSettings = {
  agent_name: 'AI Assistant',
  agent_description: 'Your helpful AI assistant',
  initial_message: 'Hello! How can I help you today?',
  placement: 'bottom-right',
  primary_color: '#2563EB', // Blue-600 color
  font_family: 'Inter, system-ui, sans-serif',
};

// Define the schema for form validation
export const clientFormSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Email is required'),
  agent_name: z.string().min(1, 'AI Agent name is required'),
  agent_description: z.string().optional(),
  logo_url: z.string().optional(),
  logo_storage_path: z.string().optional(),
});

// Extract the TypeScript type from the schema
export type ClientFormData = z.infer<typeof clientFormSchema>;
