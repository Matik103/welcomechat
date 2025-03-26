
import { ActivityType } from '@/types/client-form';

// Map activity types to human-readable labels
export const activityLabels: Partial<Record<ActivityType, string>> = {
  'client_created': 'Client Created',
  'client_updated': 'Client Updated',
  'client_deleted': 'Client Deleted',
  'client_recovered': 'Client Recovered',
  'widget_settings_updated': 'Widget Settings Updated',
  'website_url_added': 'Website URL Added',
  'website_url_deleted': 'Website URL Deleted',
  'drive_link_added': 'Google Drive Link Added',
  'drive_link_deleted': 'Google Drive Link Deleted',
  'chat_interaction': 'Chat Interaction',
  'agent_error': 'Agent Error',
  'document_added': 'Document Added',
  'document_processed': 'Document Processed',
  'document_processing_failed': 'Document Processing Failed',
  'document_removed': 'Document Removed',
  'url_added': 'URL Added',
  'url_deleted': 'URL Deleted',
  'url_processed': 'URL Processed',
  'url_processing_failed': 'URL Processing Failed',
  'embed_code_copied': 'Embed Code Copied'
};

// Map activity types to icon names
export const activityIcons: Partial<Record<ActivityType, string>> = {
  'client_created': 'user-plus',
  'client_updated': 'edit',
  'client_deleted': 'user-minus',
  'client_recovered': 'user-check',
  'widget_settings_updated': 'settings',
  'website_url_added': 'globe',
  'website_url_deleted': 'trash',
  'drive_link_added': 'file-plus',
  'drive_link_deleted': 'file-minus',
  'chat_interaction': 'message-circle',
  'agent_error': 'alert-triangle',
  'document_added': 'file-text',
  'document_processed': 'check-circle',
  'document_processing_failed': 'x-circle',
  'document_removed': 'trash-2',
  'url_added': 'link',
  'url_deleted': 'unlink',
  'url_processed': 'check',
  'url_processing_failed': 'x',
  'embed_code_copied': 'copy'
};

// Map activity types to color classes
export const activityColors: Partial<Record<ActivityType, string>> = {
  'client_created': 'bg-green-100 text-green-800',
  'client_updated': 'bg-blue-100 text-blue-800',
  'client_deleted': 'bg-red-100 text-red-800',
  'client_recovered': 'bg-yellow-100 text-yellow-800',
  'widget_settings_updated': 'bg-purple-100 text-purple-800',
  'website_url_added': 'bg-indigo-100 text-indigo-800',
  'website_url_deleted': 'bg-red-100 text-red-800',
  'drive_link_added': 'bg-blue-100 text-blue-800',
  'drive_link_deleted': 'bg-red-100 text-red-800',
  'chat_interaction': 'bg-green-100 text-green-800',
  'agent_error': 'bg-red-100 text-red-800',
  'document_added': 'bg-blue-100 text-blue-800',
  'document_processed': 'bg-green-100 text-green-800',
  'document_processing_failed': 'bg-red-100 text-red-800',
  'document_removed': 'bg-red-100 text-red-800',
  'url_added': 'bg-blue-100 text-blue-800',
  'url_deleted': 'bg-red-100 text-red-800',
  'url_processed': 'bg-green-100 text-green-800',
  'url_processing_failed': 'bg-red-100 text-red-800',
  'embed_code_copied': 'bg-purple-100 text-purple-800'
};
