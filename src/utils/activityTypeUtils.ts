
import { ActivityType } from '@/types/client-form';

// Map of activity types to human-readable descriptions
export const activityTypeLabels: Partial<Record<ActivityType, string>> = {
  'client_created': 'Client Created',
  'client_updated': 'Client Updated',
  'client_deleted': 'Client Deleted',
  'client_recovered': 'Client Recovered',
  'widget_settings_updated': 'Widget Settings Updated',
  'website_url_added': 'Website URL Added',
  'website_url_deleted': 'Website URL Deleted',
  'url_deleted': 'URL Deleted', // Backward compatibility
  'drive_link_added': 'Drive Link Added',
  'drive_link_deleted': 'Drive Link Deleted',
  'document_uploaded': 'Document Uploaded',
  'document_processed': 'Document Processed',
  'document_processing_failed': 'Document Processing Failed',
  'document_processing_started': 'Document Processing Started',
  'document_processing_completed': 'Document Processing Completed',
  'document_link_added': 'Document Link Added',
  'document_link_deleted': 'Document Link Deleted',
  'chat_interaction': 'Chat Interaction',
  'agent_name_updated': 'Agent Name Updated',
  'agent_logo_updated': 'Agent Logo Updated',
  'agent_description_updated': 'Agent Description Updated',
  'ai_agent_created': 'AI Agent Created',
  'ai_agent_updated': 'AI Agent Updated',
  'error_logged': 'Error Logged',
  'webhook_sent': 'Webhook Sent',
  'system_update': 'System Update',
  'common_query_milestone': 'Common Query Milestone',
  'interaction_milestone': 'Interaction Milestone',
  'growth_milestone': 'Growth Milestone',
  'invitation_sent': 'Invitation Sent',
  'invitation_accepted': 'Invitation Accepted',
  'user_role_updated': 'User Role Updated',
  'login_success': 'Login Success',
  'login_failed': 'Login Failed',
  'logo_uploaded': 'Logo Uploaded',
  'embed_code_copied': 'Embed Code Copied',
  'source_added': 'Source Added',
  'source_deleted': 'Source Deleted',
  'ai_agent_table_created': 'AI Agent Table Created',
  'signed_out': 'Signed Out',
  'email_sent': 'Email Sent',
  'openai_assistant_document_added': 'OpenAI Assistant Document Added'
};

// Function to get a human-readable label for an activity type
export const getActivityTypeLabel = (type: ActivityType): string => {
  return activityTypeLabels[type] || 'Unknown Activity';
};

// Map of activity types to icon names
export const activityTypeIcons: Partial<Record<ActivityType, string>> = {
  'client_created': 'user-plus',
  'client_updated': 'user-cog',
  'client_deleted': 'user-minus',
  'client_recovered': 'user-check',
  'widget_settings_updated': 'settings',
  'website_url_added': 'link-plus',
  'website_url_deleted': 'link-minus',
  'url_deleted': 'link-minus', // Backward compatibility
  'drive_link_added': 'file-plus',
  'drive_link_deleted': 'file-minus',
  'document_uploaded': 'file-upload',
  'document_processed': 'file-check',
  'document_processing_failed': 'file-warning',
  'document_processing_started': 'file-clock',
  'document_processing_completed': 'file-done',
  'document_link_added': 'file-plus',
  'document_link_deleted': 'file-minus',
  'chat_interaction': 'message-circle',
  'agent_name_updated': 'edit',
  'agent_logo_updated': 'image',
  'agent_description_updated': 'edit-3',
  'ai_agent_created': 'cpu',
  'ai_agent_updated': 'cpu-cog',
  'error_logged': 'alert-triangle',
  'webhook_sent': 'webhook',
  'system_update': 'refresh-cw',
  'common_query_milestone': 'award',
  'interaction_milestone': 'milestone',
  'growth_milestone': 'trending-up',
  'invitation_sent': 'mail',
  'invitation_accepted': 'mail-check',
  'user_role_updated': 'user-cog',
  'login_success': 'log-in',
  'login_failed': 'shield-alert',
  'logo_uploaded': 'upload',
  'embed_code_copied': 'copy',
  'source_added': 'folder-plus',
  'source_deleted': 'folder-minus',
  'ai_agent_table_created': 'database',
  'signed_out': 'log-out',
  'email_sent': 'mail-send',
  'openai_assistant_document_added': 'file-plus'
};

// Function to get an icon name for an activity type
export const getActivityTypeIcon = (type: ActivityType): string => {
  return activityTypeIcons[type] || 'activity';
};
