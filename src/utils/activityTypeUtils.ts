
import { ActivityType } from '@/types/client-form';

// Activity type display names for UI
export const activityTypeNames: Record<ActivityType, string> = {
  client_created: 'Client Created',
  client_updated: 'Client Updated',
  client_deleted: 'Client Deleted',
  client_recovered: 'Client Recovered',
  widget_settings_updated: 'Widget Settings Updated',
  website_url_added: 'Website URL Added',
  website_url_deleted: 'Website URL Deleted',
  website_url_processed: 'Website URL Processed',
  drive_link_added: 'Drive Link Added',
  drive_link_deleted: 'Drive Link Deleted',
  document_link_added: 'Document Link Added',
  document_link_deleted: 'Document Link Deleted',
  document_uploaded: 'Document Uploaded',
  document_processing_started: 'Document Processing Started',
  document_processing_completed: 'Document Processing Completed',
  document_processing_failed: 'Document Processing Failed',
  document_stored: 'Document Stored',
  document_processed: 'Document Processed',
  agent_name_updated: 'Agent Name Updated',
  agent_description_updated: 'Agent Description Updated',
  agent_updated: 'Agent Updated',
  agent_logo_updated: 'Agent Logo Updated',
  ai_agent_updated: 'AI Agent Updated',
  ai_agent_created: 'AI Agent Created',
  ai_agent_table_created: 'AI Agent Table Created',
  error_logged: 'Error Logged',
  system_update: 'System Update',
  common_query_milestone: 'Common Query Milestone',
  interaction_milestone: 'Interaction Milestone',
  growth_milestone: 'Growth Milestone',
  webhook_sent: 'Webhook Sent',
  signed_out: 'Signed Out',
  email_sent: 'Email Sent',
  invitation_sent: 'Invitation Sent',
  invitation_accepted: 'Invitation Accepted',
  logo_uploaded: 'Logo Uploaded',
  url_deleted: 'URL Deleted',
  source_deleted: 'Source Deleted',
  source_added: 'Source Added',
  widget_previewed: 'Widget Previewed',
  user_role_updated: 'User Role Updated',
  login_success: 'Login Success',
  login_failed: 'Login Failed',
  openai_assistant_document_added: 'OpenAI Assistant Document Added',
  openai_assistant_upload_failed: 'OpenAI Assistant Upload Failed',
  schema_update: 'Schema Update',
  embed_code_copied: 'Embed Code Copied',
  agent_error: 'Agent Error',
  chat_interaction: 'Chat Interaction'
};

// Get a human-readable name for an activity type
export const getActivityTypeName = (type: ActivityType): string => {
  return activityTypeNames[type] || type.replace(/_/g, ' ');
};

// Check if an activity type is related to documents
export const isDocumentActivity = (type: ActivityType): boolean => {
  return type.includes('document') || 
         type.includes('drive_link') || 
         type === 'openai_assistant_document_added' || 
         type === 'openai_assistant_upload_failed';
};
