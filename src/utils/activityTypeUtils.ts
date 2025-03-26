
import { ActivityType } from '@/types/client-form';

/**
 * Maps activity types to user-friendly descriptions
 */
export const activityDescriptions: Partial<Record<ActivityType, string>> = {
  'client_created': 'Client created',
  'client_updated': 'Client information updated',
  'client_deleted': 'Client deleted',
  'client_recovered': 'Client recovered',
  'widget_settings_updated': 'Widget settings updated',
  'website_url_added': 'Website URL added',
  'website_url_deleted': 'Website URL deleted',
  'drive_link_added': 'Google Drive link added',
  'drive_link_deleted': 'Google Drive link deleted',
  'document_uploaded': 'Document uploaded',
  'document_processed': 'Document processed',
  'document_processing_failed': 'Document processing failed',
  'chat_interaction': 'Chat interaction',
  'agent_name_updated': 'Agent name updated',
  'agent_logo_updated': 'Agent logo updated',
  'agent_description_updated': 'Agent description updated',
  'ai_agent_created': 'AI agent created',
  'ai_agent_updated': 'AI agent updated',
  'error_logged': 'Error logged',
  'webhook_sent': 'Webhook sent',
  'system_update': 'System update',
  'common_query_milestone': 'Common query milestone reached',
  'interaction_milestone': 'Interaction milestone reached',
  'growth_milestone': 'Growth milestone reached',
  'invitation_sent': 'Invitation sent',
  'invitation_accepted': 'Invitation accepted',
  'user_role_updated': 'User role updated',
  'login_success': 'Successful login',
  'login_failed': 'Failed login attempt',
  'logo_uploaded': 'Logo uploaded',
  'embed_code_copied': 'Embed code copied',
  'source_added': 'Source added',
  'source_deleted': 'Source deleted',
  'ai_agent_table_created': 'AI Agent table created',
  'signed_out': 'Signed out',
  'email_sent': 'Email sent',
  'openai_assistant_document_added': 'OpenAI assistant document added',
};

/**
 * Gets a user-friendly description for an activity type
 */
export const getActivityDescription = (activityType: ActivityType): string => {
  return activityDescriptions[activityType] || activityType.replace(/_/g, ' ');
};

/**
 * Maps activity types to icon names
 */
export const activityIcons: Partial<Record<ActivityType, string>> = {
  'client_created': 'UserPlus',
  'client_updated': 'Edit',
  'client_deleted': 'UserMinus',
  'client_recovered': 'RefreshCw',
  'widget_settings_updated': 'Settings',
  'website_url_added': 'Globe',
  'website_url_deleted': 'Trash',
  'drive_link_added': 'FileText',
  'drive_link_deleted': 'Trash',
  'document_uploaded': 'Upload',
  'document_processed': 'CheckCircle',
  'document_processing_failed': 'AlertCircle',
  'chat_interaction': 'MessageSquare',
  'agent_name_updated': 'Edit',
  'agent_logo_updated': 'Image',
  'agent_description_updated': 'Edit',
  'ai_agent_created': 'Bot',
  'ai_agent_updated': 'Bot',
  'error_logged': 'AlertTriangle',
  'webhook_sent': 'Send',
  'system_update': 'RefreshCw',
  'common_query_milestone': 'Award',
  'interaction_milestone': 'Award',
  'growth_milestone': 'TrendingUp',
  'invitation_sent': 'Send',
  'invitation_accepted': 'UserCheck',
  'user_role_updated': 'Users',
  'login_success': 'LogIn',
  'login_failed': 'AlertCircle',
  'logo_uploaded': 'Image',
  'embed_code_copied': 'Clipboard',
  'source_added': 'Plus',
  'source_deleted': 'Trash',
  'ai_agent_table_created': 'Database',
  'signed_out': 'LogOut',
  'email_sent': 'Mail',
  'openai_assistant_document_added': 'FileText',
};

/**
 * Gets an icon name for an activity type
 */
export const getActivityIcon = (activityType: ActivityType): string => {
  return activityIcons[activityType] || 'Activity';
};
