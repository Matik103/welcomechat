
import { Json } from '@/integrations/supabase/types';

export type ActivityType = 
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
  | 'document_uploaded'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_processing_failed'
  | 'document_stored'
  | 'document_processed'
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
  | 'openai_assistant_document_added'
  | 'openai_assistant_upload_failed'
  | 'schema_update'
  | 'embed_code_copied'
  | 'agent_error'
  | 'chat_interaction';

export interface ClientFormData {
  client_id: string;
  client_name: string;
  email: string;
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
  };
  _tempLogoFile?: any;
}

export interface WidgetSettings {
  agent_name?: string;
  agent_description?: string;
  logo_url?: string;
  logo_storage_path?: string;
  chat_color?: string;
  background_color?: string;
  button_color?: string;
  font_color?: string;
  chat_font_color?: string;
  background_opacity?: number;
  button_text?: string;
  position?: 'left' | 'right';
  greeting_message?: string;
}

export interface ClientSettings {
  client_id: string;
  settings: Record<string, any>;
}
