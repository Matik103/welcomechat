
export type ActivityType = 
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_settings_updated'
  | 'website_url_added'
  | 'website_url_deleted'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'chat_interaction'
  | 'agent_error'
  | 'document_added'
  | 'document_processed'
  | 'document_processing_failed'
  | 'document_removed'
  | 'url_added'
  | 'url_deleted'
  | 'url_processed'
  | 'url_processing_failed'
  | 'embed_code_copied';

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
