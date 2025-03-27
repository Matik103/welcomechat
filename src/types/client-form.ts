
import { z } from 'zod';
import { Json } from '@/integrations/supabase/types';

// Define the client form schema for validation
export const clientFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  description: z.string().optional(), 
  client_id: z.string().optional(),
  _tempLogoFile: z.any().optional().nullable(),
  widget_settings: z.object({
    agent_name: z.string().optional(),
    agent_description: z.string().optional(),
    logo_url: z.string().optional(),
    logo_storage_path: z.string().optional()
  }).optional()
});

// Define the client form data type
export type ClientFormData = z.infer<typeof clientFormSchema>;

// Define the client form errors type for validation errors
export interface ClientFormErrors {
  [key: string]: string;
}

// Define the widget settings type
export interface WidgetSettings {
  agent_name: string;
  agent_description: string;
  logo_url: string;
  logo_storage_path: string;
  chat_color: string;
  background_color: string;
  button_color?: string; // Make this optional to match actual usage
  font_color: string;
  chat_font_color: string;
  background_opacity: number;
  button_text: string;
  position: "left" | "right";
  greeting_message: string;
  text_color: string;
  secondary_color: string;
  welcome_text: string;
  response_time_text: string;
  display_mode: string;
}

// ActivityType enum (matching the database enum)
export type ActivityType = 
  | 'document_uploaded'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_processing_failed'
  | 'openai_assistant_document_added'
  | 'openai_assistant_upload_failed'
  | 'schema_update'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_settings_updated'
  | 'website_url_added'
  | 'website_url_deleted'
  | 'website_url_processed'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'document_processed'
  | 'document_stored'
  | 'agent_name_updated'
  | 'agent_description_updated'
  | 'agent_updated'
  | 'agent_logo_updated'
  | 'ai_agent_updated'
  | 'ai_agent_created'
  | 'ai_agent_table_created'
  | 'error_logged'
  | 'system_update'
  | 'common_query_milestone'
  | 'interaction_milestone'
  | 'growth_milestone'
  | 'webhook_sent'
  | 'signed_out'
  | 'email_sent'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'logo_uploaded'
  | 'url_deleted'
  | 'source_deleted'
  | 'source_added'
  | 'widget_previewed'
  | 'user_role_updated'
  | 'login_success'
  | 'login_failed'
  | 'embed_code_copied'
  | 'agent_error'
  | 'chat_interaction'
  | 'account_created';
