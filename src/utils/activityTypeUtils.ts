
import { LucideIcon } from 'lucide-react';

// Create a map of activity types to icon names
export const activityTypeToIcon: Record<string, string> = {
  'document_added': 'file-plus',
  'document_removed': 'file-minus',
  'document_processed': 'file-check',
  'document_processing_failed': 'file-warning',
  'url_added': 'link',
  'url_removed': 'link',
  'url_processed': 'globe',
  'url_processing_failed': 'globe',
  'chat_interaction': 'message-square',
  'chat_message_sent': 'message-square',
  'chat_message_received': 'message-square',
  'client_created': 'user-plus',
  'client_updated': 'edit',
  'client_deleted': 'trash',
  'client_recovered': 'rotate-ccw',
  'agent_created': 'bot',
  'agent_updated': 'edit',
  'agent_deleted': 'trash',
  'agent_name_updated': 'edit',
  'agent_description_updated': 'edit',
  'agent_error': 'alert-circle',
  'agent_logo_updated': 'image',
  'webhook_sent': 'code',
  'email_sent': 'mail',
  'invitation_sent': 'mail',
  'invitation_accepted': 'check',
  'widget_previewed': 'eye',
  'user_role_updated': 'users',
  'login_success': 'log-in',
  'login_failed': 'alert-circle',
  'signed_out': 'log-out',
  'widget_settings_updated': 'settings',
  'logo_uploaded': 'upload',
  'system_update': 'settings',
  'source_deleted': 'trash',
  'source_added': 'file-plus',
  'error_logged': 'alert-circle'
};

// Create a map of activity types to colors
export const activityTypeToColor: Record<string, string> = {
  'document_added': 'green',
  'document_removed': 'red',
  'document_processed': 'blue',
  'document_processing_failed': 'yellow',
  'url_added': 'green',
  'url_removed': 'red',
  'url_processed': 'blue',
  'url_processing_failed': 'yellow',
  'chat_interaction': 'purple',
  'chat_message_sent': 'purple',
  'chat_message_received': 'purple',
  'client_created': 'green',
  'client_updated': 'blue',
  'client_deleted': 'red',
  'client_recovered': 'green',
  'agent_created': 'green',
  'agent_updated': 'blue',
  'agent_deleted': 'red',
  'agent_name_updated': 'blue',
  'agent_description_updated': 'blue',
  'agent_error': 'red',
  'agent_logo_updated': 'blue',
  'webhook_sent': 'indigo',
  'email_sent': 'blue',
  'invitation_sent': 'blue',
  'invitation_accepted': 'green',
  'widget_previewed': 'blue',
  'user_role_updated': 'blue',
  'login_success': 'green',
  'login_failed': 'red',
  'signed_out': 'gray',
  'widget_settings_updated': 'blue',
  'logo_uploaded': 'blue',
  'system_update': 'blue',
  'source_deleted': 'red',
  'source_added': 'green',
  'error_logged': 'red'
};

// Get a human-readable label for an activity type
export function getActivityTypeLabel(type: string): string {
  // Convert snake_case to Title Case
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
