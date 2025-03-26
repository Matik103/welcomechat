
import { ActivityType } from '@/types/client-form';

/**
 * Map activity types to readable text for users
 */
export const activityLabels: Partial<Record<ActivityType, string>> = {
  'client_created': 'Client created',
  'client_updated': 'Client updated',
  'client_deleted': 'Client deleted',
  'widget_settings_updated': 'Widget settings updated',
  'website_url_added': 'Website URL added',
  'website_url_deleted': 'Website URL deleted',
  'website_url_processed': 'Website URL processed',
  'document_link_added': 'Document link added',
  'document_link_deleted': 'Document link deleted',
  'document_processed': 'Document processed',
  'document_added': 'Document added',
  'agent_error': 'Agent error',
  'login_success': 'Login successful',
  'login_failed': 'Login failed',
  'password_reset': 'Password reset',
  'user_invited': 'User invited',
  'invitation_accepted': 'Invitation accepted',
  'config_updated': 'Configuration updated'
};

/**
 * Map activity types to icons
 */
export const activityIcons: Partial<Record<ActivityType, string>> = {
  'client_created': 'UserPlus',
  'client_updated': 'UserCog',
  'client_deleted': 'UserMinus',
  'widget_settings_updated': 'Settings',
  'website_url_added': 'Globe',
  'website_url_deleted': 'Trash',
  'website_url_processed': 'RefreshCw',
  'document_link_added': 'FileText',
  'document_link_deleted': 'Trash',
  'document_processed': 'CheckCircle',
  'document_added': 'FileText',
  'agent_error': 'AlertTriangle',
  'login_success': 'LogIn',
  'login_failed': 'AlertCircle',
  'password_reset': 'Key',
  'user_invited': 'Mail',
  'invitation_accepted': 'CheckSquare',
  'config_updated': 'Settings'
};

/**
 * Map activity types to color indicators
 */
export const activityColors: Partial<Record<ActivityType, string>> = {
  'client_created': 'green',
  'client_updated': 'blue',
  'client_deleted': 'red',
  'widget_settings_updated': 'blue',
  'website_url_added': 'green',
  'website_url_deleted': 'red',
  'website_url_processed': 'blue',
  'document_link_added': 'green',
  'document_link_deleted': 'red',
  'document_processed': 'green',
  'document_added': 'green',
  'agent_error': 'red',
  'login_success': 'green',
  'login_failed': 'red',
  'password_reset': 'yellow',
  'user_invited': 'blue',
  'invitation_accepted': 'green',
  'config_updated': 'blue'
};
