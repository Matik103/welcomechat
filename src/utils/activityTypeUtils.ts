
import { ActivityType, ActivityTypeString } from '@/types/activity';

// Map activity types to icon names
export const activityTypeToIcon: Record<string, string> = {
  'chat_interaction': 'message-square',
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
  'document_added': 'file-plus',
  'document_removed': 'file-minus',
  'document_processed': 'file-check',
  'document_processing_failed': 'file-warning',
  'url_added': 'globe',
  'url_removed': 'trash',
  'url_processed': 'check-circle',
  'url_processing_failed': 'alert-circle',
  'webhook_sent': 'code',
  'email_sent': 'mail',
  'invitation_sent': 'mail',
  'invitation_accepted': 'check-circle',
  'widget_previewed': 'eye',
  'user_role_updated': 'key',
  'login_success': 'log-in',
  'login_failed': 'alert-circle',
  'signed_out': 'log-out',
  'widget_settings_updated': 'settings',
  'logo_uploaded': 'image',
  'system_update': 'settings',
  'source_deleted': 'trash',
  'source_added': 'plus',
  'error_logged': 'alert-triangle',
  'unknown': 'help-circle'
};

// Map activity types to colors
export const activityTypeToColor: Record<string, string> = {
  'chat_interaction': 'purple',
  'client_created': 'green',
  'client_updated': 'blue',
  'client_deleted': 'red',
  'client_recovered': 'amber',
  'agent_created': 'indigo',
  'agent_updated': 'blue',
  'agent_deleted': 'red',
  'agent_name_updated': 'blue',
  'agent_description_updated': 'blue',
  'agent_error': 'red',
  'agent_logo_updated': 'blue',
  'document_added': 'emerald',
  'document_removed': 'red',
  'document_processed': 'green',
  'document_processing_failed': 'red',
  'url_added': 'sky',
  'url_removed': 'red',
  'url_processed': 'green',
  'url_processing_failed': 'red',
  'webhook_sent': 'indigo',
  'email_sent': 'blue',
  'invitation_sent': 'blue',
  'invitation_accepted': 'green',
  'widget_previewed': 'purple',
  'user_role_updated': 'amber',
  'login_success': 'green',
  'login_failed': 'red',
  'signed_out': 'gray',
  'widget_settings_updated': 'blue',
  'logo_uploaded': 'emerald',
  'system_update': 'gray',
  'source_deleted': 'red',
  'source_added': 'green',
  'error_logged': 'red',
  'unknown': 'gray'
};

// Get a readable label for an activity type
export const getActivityTypeLabel = (activityType: string): string => {
  if (!activityType) return "Unknown Activity";
  
  // Convert from snake_case to Title Case
  return activityType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// List of valid activity types for type checking
const VALID_ACTIVITY_TYPES = Object.values(ActivityType);

/**
 * Ensure activity type is a valid enum value for the database
 * 
 * This is crucial for preventing type errors when inserting activities
 * as Supabase enforces strict type checking on enum columns
 */
export const getSafeActivityType = (type: string): string => {
  // These activity types are known to exist in the database
  const safeActivityTypes = [
    'document_added',
    'document_removed',
    'document_processed',
    'document_processing_failed',
    'url_added',
    'url_removed',
    'url_processed',
    'url_processing_failed',
    'chat_message_sent',
    'chat_message_received',
    'client_created',
    'client_updated',
    'client_deleted',
    'client_recovered',
    'agent_created',
    'agent_updated',
    'agent_deleted',
    'agent_name_updated',
    'agent_description_updated',
    'agent_error',
    'agent_logo_updated',
    'webhook_sent',
    'email_sent',
    'invitation_sent',
    'invitation_accepted',
    'widget_previewed',
    'user_role_updated',
    'login_success',
    'login_failed',
    'signed_out',
    'widget_settings_updated',
    'logo_uploaded',
    'system_update',
    'source_deleted',
    'source_added',
    'error_logged'
  ];
  
  if (safeActivityTypes.includes(type)) {
    return type;
  }
  
  // Fallback to client_updated which is a safe activity type that exists in the database
  console.warn(`Activity type "${type}" is not in the allowed list, using "client_updated" instead`);
  return 'client_updated';
};
