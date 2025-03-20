
/**
 * Extended activity types for client activities
 */
export type ExtendedActivityType =
  | "chat_interaction"
  | "client_created"
  | "client_updated"
  | "client_deleted"
  | "client_recovered"
  | "widget_settings_updated"
  | "website_url_added"
  | "website_url_deleted"
  | "website_url_processed"
  | "drive_link_added"
  | "drive_link_deleted"
  | "document_link_added"
  | "document_link_deleted"
  | "document_uploaded"
  | "document_processed"
  | "document_stored"
  | "document_processing_started"
  | "document_processing_completed"
  | "document_processing_failed"
  | "error_logged"
  | "common_query_milestone"
  | "interaction_milestone"
  | "growth_milestone"
  | "webhook_sent"
  | "ai_agent_created"
  | "ai_agent_updated"
  | "ai_agent_table_created"
  | "agent_name_updated"
  | "agent_description_updated"
  | "agent_error"
  | "agent_logo_updated"
  | "signed_out"
  | "embed_code_copied"
  | "logo_uploaded"
  | "system_update"
  | "source_deleted"
  | "source_added"
  | "url_deleted"
  | "email_sent"
  | "invitation_sent"
  | "invitation_accepted"
  | "widget_previewed"
  | "user_role_updated"
  | "login_success"
  | "login_failed";

export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata: any;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

// Client status type
export type ClientStatus = 'active' | 'inactive' | 'deleted';
