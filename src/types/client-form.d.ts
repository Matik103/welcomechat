
export type ActivityType = 
  | 'login' 
  | 'logout' 
  | 'settings_updated' 
  | 'password_changed'
  | 'website_added'
  | 'website_removed'
  | 'document_added'
  | 'document_removed'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'ai_agent_created'  // Changed from agent_updated
  | 'ai_agent_updated'  // Changed from agent_updated
  | 'widget_updated'
  | 'password_reset'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'website_url_added'
  | 'website_url_deleted'
  | 'website_url_processed'
  | 'url_added'
  | 'url_removed'
  | 'url_processed'
  | 'url_processing_failed'
  | 'document_processed'
  | 'document_processing_failed';
