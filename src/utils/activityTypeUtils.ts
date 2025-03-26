
import { ActivityType } from '@/types/client-form';

/**
 * Maps activity types to user-friendly display names for the admin dashboard
 */
export const activityTypeNames: Partial<Record<ActivityType, string>> = {
  'client_created': 'Client Created',
  'client_updated': 'Client Updated',
  'client_deleted': 'Client Deleted',
  'website_url_added': 'Website Added',
  'website_url_deleted': 'Website Removed',
  'website_url_processed': 'Website Processed',
  'document_link_added': 'Document Link Added',
  'document_link_deleted': 'Document Link Removed',
  'document_processed': 'Document Processed',
  'document_added': 'Document Added',
  'agent_error': 'Agent Error',
  'login_success': 'Login Success',
  'login_failed': 'Login Failed',
  'password_reset': 'Password Reset',
  'user_invited': 'User Invited',
  'invitation_accepted': 'Invitation Accepted'
};

/**
 * Maps activity types to icons (Lucide icon names) for display in the dashboard
 */
export const activityTypeIcons: Partial<Record<ActivityType, string>> = {
  'client_created': 'UserPlus',
  'client_updated': 'UserCog',
  'client_deleted': 'UserMinus',
  'website_url_added': 'Globe',
  'website_url_deleted': 'Trash2',
  'website_url_processed': 'Check',
  'document_link_added': 'FileText',
  'document_link_deleted': 'Trash2',
  'document_processed': 'Check',
  'document_added': 'FileUpload',
  'agent_error': 'AlertCircle',
  'login_success': 'LogIn',
  'login_failed': 'AlertTriangle',
  'password_reset': 'Key',
  'user_invited': 'Mail',
  'invitation_accepted': 'UserCheck'
};

/**
 * Maps activity types to colors for visual distinction in the dashboard
 */
export const activityTypeColors: Partial<Record<ActivityType, string>> = {
  'client_created': 'bg-green-100 text-green-800',
  'client_updated': 'bg-blue-100 text-blue-800',
  'client_deleted': 'bg-red-100 text-red-800',
  'website_url_added': 'bg-indigo-100 text-indigo-800',
  'website_url_deleted': 'bg-orange-100 text-orange-800',
  'website_url_processed': 'bg-teal-100 text-teal-800',
  'document_link_added': 'bg-cyan-100 text-cyan-800',
  'document_link_deleted': 'bg-amber-100 text-amber-800',
  'document_processed': 'bg-lime-100 text-lime-800',
  'document_added': 'bg-violet-100 text-violet-800',
  'agent_error': 'bg-red-100 text-red-800',
  'login_success': 'bg-green-100 text-green-800',
  'login_failed': 'bg-red-100 text-red-800',
  'password_reset': 'bg-blue-100 text-blue-800',
  'user_invited': 'bg-indigo-100 text-indigo-800',
  'invitation_accepted': 'bg-emerald-100 text-emerald-800'
};
