
import { ActivityType } from '@/types/client-form';

// Generate human-readable labels for activity types
export const activityTypeLabels: Record<ActivityType, string> = {
  'client_created': 'Client Created',
  'client_updated': 'Client Updated',
  'client_deleted': 'Client Deleted',
  'client_recovered': 'Client Recovered',
  'widget_settings_updated': 'Widget Settings Updated',
  'website_url_added': 'Website URL Added',
  'website_url_deleted': 'Website URL Deleted',
  'drive_link_added': 'Drive Link Added',
  'drive_link_deleted': 'Drive Link Deleted',
  'document_uploaded': 'Document Uploaded',
  'document_processed': 'Document Processed',
  'document_processing_failed': 'Document Processing Failed',
  'document_processing_started': 'Document Processing Started',
  'document_processing_completed': 'Document Processing Completed',
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
  'ai_agent_table_created': 'AI Agent Table Created'
};

// Generate AI prompt based on activity
export const generateAiPrompt = (activityType: ActivityType, details?: Record<string, any>): string => {
  const basePrompts: Record<ActivityType, string> = {
    'client_created': 'A new client was created.',
    'client_updated': 'Client information was updated.',
    'client_deleted': 'A client was marked for deletion.',
    'client_recovered': 'A client was recovered from deletion.',
    'widget_settings_updated': 'Widget appearance settings were updated.',
    'website_url_added': 'A new website URL was added for content crawling.',
    'website_url_deleted': 'A website URL was removed from content sources.',
    'drive_link_added': 'A new Google Drive link was added as a content source.',
    'drive_link_deleted': 'A Google Drive link was removed from content sources.',
    'document_uploaded': 'A new document was uploaded.',
    'document_processed': 'A document was processed successfully.',
    'document_processing_failed': 'Document processing encountered an error.',
    'document_processing_started': 'Document processing has started.',
    'document_processing_completed': 'Document processing has completed.',
    'chat_interaction': 'A user interacted with the chatbot.',
    'agent_name_updated': 'The AI agent name was updated.',
    'agent_logo_updated': 'The AI agent logo was updated.',
    'agent_description_updated': 'The AI agent description was updated.',
    'ai_agent_created': 'A new AI agent was created.',
    'ai_agent_updated': 'AI agent settings were updated.',
    'error_logged': 'An error was logged in the system.',
    'webhook_sent': 'A webhook notification was sent.',
    'system_update': 'The system was updated.',
    'common_query_milestone': 'A significant number of similar queries were detected.',
    'interaction_milestone': 'A milestone number of interactions was reached.',
    'growth_milestone': 'A growth milestone was achieved.',
    'invitation_sent': 'An invitation was sent to a user.',
    'invitation_accepted': 'A user accepted an invitation.',
    'user_role_updated': 'A user role was updated.',
    'login_success': 'A user logged in successfully.',
    'login_failed': 'A login attempt failed.',
    'logo_uploaded': 'A logo was uploaded.',
    'embed_code_copied': 'The embed code was copied.',
    'source_added': 'A new content source was added.',
    'source_deleted': 'A content source was removed.',
    'ai_agent_table_created': 'AI agent database table was created.'
  };

  return basePrompts[activityType] || 'An activity occurred in the system.';
};

// Convert activity type to CSS color class
export const getActivityTypeColor = (activityType: string): string => {
  const colorMap: Record<string, string> = {
    'client_created': 'bg-green-100 text-green-800',
    'client_updated': 'bg-blue-100 text-blue-800',
    'client_deleted': 'bg-red-100 text-red-800',
    'document_uploaded': 'bg-purple-100 text-purple-800',
    'document_processed': 'bg-emerald-100 text-emerald-800',
    'document_processing_failed': 'bg-red-100 text-red-800',
    'error_logged': 'bg-yellow-100 text-yellow-800',
    'chat_interaction': 'bg-indigo-100 text-indigo-800',
    'logo_uploaded': 'bg-teal-100 text-teal-800'
  };

  return colorMap[activityType] || 'bg-gray-100 text-gray-800';
};
