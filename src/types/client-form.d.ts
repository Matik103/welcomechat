
export type ActivityType = 
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'document_added'
  | 'document_removed'
  | 'document_processed'
  | 'document_processing_failed'
  | 'url_added'
  | 'url_removed'
  | 'url_processed'
  | 'url_processing_failed'
  | 'widget_settings_updated'
  | 'agent_created'
  | 'agent_updated'
  | 'agent_deleted'
  | 'agent_settings_updated'
  | 'user_login'
  | 'user_logout'
  | 'user_password_reset'
  | 'user_email_changed'
  | 'user_profile_updated'
  | 'chat_interaction';

export interface ClientFormData {
  client_name: string;
  email: string;
  company?: string;
  description?: string;
  widget_settings?: {
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
  };
  _tempLogoFile?: File;
}
