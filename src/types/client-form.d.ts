
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
  | 'agent_updated'
  | 'widget_updated'
  | 'password_reset'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'website_url_added'    // Added website_url specific activities
  | 'website_url_deleted'; // to match what's used in WebsiteResourcesSection
