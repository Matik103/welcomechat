
// We're synchronizing this with client-form.ts to ensure consistency
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
  | "document_processing_failed"
  | "document_processing_started"
  | "document_processing_completed"
  | "agent_name_updated"
  | "agent_description_updated"
  | "agent_updated"
  | "agent_logo_updated"
  | "ai_agent_updated"
  | "ai_agent_created"
  | "error_logged"
  | "system_update"
  | "common_query_milestone"
  | "interaction_milestone"
  | "growth_milestone"
  | "webhook_sent"
  | "signed_out"
  | "email_sent"
  | "invitation_sent"
  | "invitation_accepted"
  | "logo_uploaded"
  | "url_deleted"
  | "source_deleted"
  | "source_added"
  | "widget_previewed"
  | "user_role_updated"
  | "login_success"
  | "login_failed"
  | "openai_assistant_document_added"
  | "openai_assistant_upload_failed"
  | "schema_update"
  | "embed_code_copied";

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
