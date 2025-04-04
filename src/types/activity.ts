// Define ActivityType as both an enum and a type for better TypeScript support
export enum ActivityType {
  URL_ADDED = 'url_added',
  URL_REMOVED = 'url_removed',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  AGENT_CREATED = 'agent_created',
  LOGIN = 'login',
  LOGOUT = 'logout',
  WIDGET_SETTINGS_UPDATED = 'widget_settings_updated',
  LOGO_UPLOADED = 'logo_uploaded',
  WIDGET_PREVIEWED = 'widget_previewed',
  PROFILE_UPDATED = 'profile_updated',
  PAGE_VIEW = 'page_view'
}

// Also keep the type for backward compatibility
export type ActivityTypeString = 
  | 'url_added' 
  | 'url_removed' 
  | 'document_added' 
  | 'document_removed' 
  | 'client_created' 
  | 'client_updated' 
  | 'agent_created'
  | 'login' 
  | 'logout'
  | 'widget_settings_updated'
  | 'logo_uploaded'
  | 'widget_previewed'
  | 'profile_updated'
  | 'page_view';

// Define ClientActivity type that was referenced but missing
export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType | string;
  activity_data: Record<string, any>;
  description?: string;
  created_at: string;
  updated_at?: string;
  timeAgo?: string;
  metadata?: any;
}
