export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  description: string;
  created_at: string;
  metadata: any;
  type?: string;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

export type ClientStatus = 'active' | 'inactive' | 'deleted';

// Define a safer set of activity types that matches the database enum
export type ActivityType = 
  | 'document_added'
  | 'document_removed'
  | 'document_processed'
  | 'document_processing_failed'
  | 'url_added'
  | 'url_removed'
  | 'url_processed'
  | 'url_processing_failed'
  | 'chat_message_sent'
  | 'chat_message_received'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'agent_created'
  | 'agent_updated'
  | 'agent_deleted'
  | 'agent_name_updated'
  | 'agent_description_updated'
  | 'agent_error'
  | 'agent_logo_updated'
  | 'webhook_sent'
  | 'email_sent'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'widget_previewed'
  | 'user_role_updated'
  | 'login_success'
  | 'login_failed'
  | 'signed_out'
  | 'widget_settings_updated'
  | 'logo_uploaded'
  | 'system_update'
  | 'source_deleted'
  | 'source_added';
