// Define ActivityType as both an enum and a type for better TypeScript support
export enum ActivityType {
  URL_ADDED = 'url_added',
  URL_REMOVED = 'url_removed',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  DOCUMENT_PROCESSED = 'document_processed',
  DOCUMENT_PROCESSING_FAILED = 'document_processing_failed',
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  AGENT_CREATED = 'agent_created',
  AGENT_UPDATED = 'agent_updated',
  AGENT_DELETED = 'agent_deleted',
  LOGIN = 'login',
  LOGOUT = 'logout',
  WIDGET_SETTINGS_UPDATED = 'widget_settings_updated',
  LOGO_UPLOADED = 'logo_uploaded',
  WIDGET_PREVIEWED = 'widget_previewed',
  PROFILE_UPDATED = 'profile_updated',
  PAGE_VIEW = 'page_view'
}

// Add a DocumentType enum that was missing
export enum DocumentType {
  PDF = 'pdf',
  DOCX = 'docx',
  TXT = 'txt',
  HTML = 'html',
  GOOGLE_DRIVE = 'google_drive',
  GOOGLE_DOC = 'google_doc',
  GOOGLE_SHEET = 'google_sheet',
  GOOGLE_SLIDE = 'google_slide'
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

// Define ClientActivity type that ensures compatibility across the application
export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType | string;
  activity_data: Record<string, any>;
  description?: string; // Make this optional to match all usages
  created_at: string;
  updated_at?: string;
  timeAgo?: string;
  metadata?: any;
}
