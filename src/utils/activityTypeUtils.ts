
import { ActivityType } from '@/types/client-form';

// Define activity type labels for display purposes
export const ACTIVITY_TYPE_LABELS: Partial<Record<ActivityType, string>> = {
  'client_created': 'Client Created',
  'client_updated': 'Client Updated',
  'client_deleted': 'Client Deleted',
  'config_updated': 'Configuration Updated',
  'website_url_added': 'Website URL Added',
  'website_url_deleted': 'Website URL Deleted',
  'website_url_processed': 'Website URL Processed',
  'document_link_added': 'Document Link Added',
  'document_link_deleted': 'Document Link Deleted',
  'document_processed': 'Document Processed',
  'document_added': 'Document Added',
  'agent_error': 'Agent Error',
  'login_success': 'Login Success',
  'login_failed': 'Login Failed',
  'password_reset': 'Password Reset',
  'user_invited': 'User Invited',
  'invitation_accepted': 'Invitation Accepted'
};

// Define icon names for each activity type
export const ACTIVITY_TYPE_ICONS: Partial<Record<ActivityType, string>> = {
  'client_created': 'UserPlus',
  'client_updated': 'UserCog',
  'client_deleted': 'UserMinus',
  'config_updated': 'Settings',
  'website_url_added': 'Globe',
  'website_url_deleted': 'Trash',
  'website_url_processed': 'CheckCircle',
  'document_link_added': 'FileText',
  'document_link_deleted': 'Trash',
  'document_processed': 'CheckCircle',
  'document_added': 'FileText',
  'agent_error': 'AlertTriangle',
  'login_success': 'LogIn',
  'login_failed': 'AlertCircle',
  'password_reset': 'Key',
  'user_invited': 'Mail',
  'invitation_accepted': 'UserCheck'
};

// Define color classes for each activity type
export const ACTIVITY_TYPE_COLORS: Partial<Record<ActivityType, string>> = {
  'client_created': 'text-green-500',
  'client_updated': 'text-blue-500',
  'client_deleted': 'text-red-500',
  'config_updated': 'text-violet-500',
  'website_url_added': 'text-green-500',
  'website_url_deleted': 'text-red-500',
  'website_url_processed': 'text-green-500',
  'document_link_added': 'text-green-500',
  'document_link_deleted': 'text-red-500',
  'document_processed': 'text-green-500',
  'document_added': 'text-green-500',
  'agent_error': 'text-red-500',
  'login_success': 'text-green-500',
  'login_failed': 'text-red-500',
  'password_reset': 'text-amber-500',
  'user_invited': 'text-blue-500',
  'invitation_accepted': 'text-green-500'
};
