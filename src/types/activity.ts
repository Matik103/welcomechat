export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: string;
  created_at: string;
  description?: string;
  details?: Record<string, any>;
  user_id?: string;
  metadata?: any;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

export type ClientStatus = 'active' | 'inactive' | 'deleted';

// Define activity types as a const object
export const ActivityType = {
  DOCUMENT_ADDED: 'document_added',
  DOCUMENT_REMOVED: 'document_removed',
  DOCUMENT_PROCESSED: 'document_processed',
  DOCUMENT_PROCESSING_FAILED: 'document_processing_failed',
  URL_ADDED: 'url_added',
  URL_REMOVED: 'url_removed',
  URL_PROCESSED: 'url_processed',
  URL_PROCESSING_FAILED: 'url_processing_failed',
  CHAT_INTERACTION: 'chat_interaction',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_MESSAGE_RECEIVED: 'chat_message_received',
  CLIENT_CREATED: 'client_created',
  CLIENT_UPDATED: 'client_updated',
  CLIENT_DELETED: 'client_deleted',
  CLIENT_RECOVERED: 'client_recovered',
  AGENT_CREATED: 'agent_created',
  AGENT_UPDATED: 'agent_updated',
  AGENT_DELETED: 'agent_deleted',
  AGENT_NAME_UPDATED: 'agent_name_updated',
  AGENT_DESCRIPTION_UPDATED: 'agent_description_updated',
  AGENT_ERROR: 'agent_error',
  AGENT_LOGO_UPDATED: 'agent_logo_updated',
  WEBHOOK_SENT: 'webhook_sent',
  EMAIL_SENT: 'email_sent',
  INVITATION_SENT: 'invitation_sent',
  INVITATION_ACCEPTED: 'invitation_accepted',
  WIDGET_PREVIEWED: 'widget_previewed',
  USER_ROLE_UPDATED: 'user_role_updated',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  SIGNED_OUT: 'signed_out',
  WIDGET_SETTINGS_UPDATED: 'widget_settings_updated',
  LOGO_UPLOADED: 'logo_uploaded',
  SYSTEM_UPDATE: 'system_update',
  SOURCE_DELETED: 'source_deleted',
  SOURCE_ADDED: 'source_added',
  ERROR_LOGGED: 'error_logged'
} as const;

// Define the type based on the const object
export type ActivityType = typeof ActivityType[keyof typeof ActivityType];

// Export literal type string union for type checking
export type ActivityTypeString = keyof typeof ActivityType | string;

// Now let's update the document-processing.d.ts file to add the missing types
<lov-write file_path="src/types/document-processing.d.ts">
// Document processing types
export type DocumentType = 'pdf' | 'docx' | 'txt' | 'csv' | 'xlsx' | 'md' | 'html' | 'google_drive' | 'document' | 'url';

export interface DocumentProcessingStatus {
  status: 'init' | 'uploading' | 'parsing' | 'processing' | 'storing' | 'syncing' | 'completed' | 'failed';
  stage?: 'init' | 'uploading' | 'parsing' | 'processing' | 'storing' | 'syncing' | 'completed' | 'failed' | 'analyzing' | 'complete';
  progress?: number;
  message?: string;
  error?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  error?: string;
  processed: number;
  failed: number;
  aiProcessed?: number;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface DocumentProcessingOptions {
  clientId: string;
  shouldUseAI?: boolean;
  syncToAgent?: boolean;
  syncToProfile?: boolean;
  syncToWidgetSettings?: boolean;
  processingMethod?: 'auto' | 'text' | 'pdf' | 'docx' | 'csv' | 'html';
}

export interface LlamaIndexJobResponse {
  job_id: string;
  status: string;
  message?: string;
}

export interface LlamaIndexParsingResult {
  chunks: LlamaIndexDocumentChunk[];
  length?: number;
}

export interface LlamaIndexDocumentChunk {
  text: string;
  metadata: Record<string, any>;
}

export interface LlamaIndexProcessingOptions {
  clientId: string;
  chunkSize?: number;
  overlapSize?: number;
}

export interface DocumentMetadata {
  file_name: string;
  file_size: number;
  file_type: string;
  content_type?: string;
  storage_path: string;
  processing_completed?: string;
  llama_job_id?: LlamaIndexJobResponse;
  [key: string]: any;
}
