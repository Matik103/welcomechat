
import { ActivityType } from '@/types/client-form';

// Activity type to display text mapping
export const activityTypeToDisplayText: Partial<Record<ActivityType, string>> = {
  // Remove 'login' and 'logout' which are not defined in ActivityType
  'settings_updated': 'Updated settings',
  'password_changed': 'Changed password',
  'website_added': 'Added website',
  'website_removed': 'Removed website',
  'document_added': 'Added document',
  'document_removed': 'Removed document',
  'client_created': 'Created client',
  'client_updated': 'Updated client',
  'client_deleted': 'Deleted client',
  'agent_updated': 'Updated AI agent',
  'widget_updated': 'Updated widget',
  'password_reset': 'Password reset',
  'document_link_added': 'Added document link',
  'document_link_deleted': 'Deleted document link',
  'website_url_added': 'Added website URL',
  'website_url_deleted': 'Deleted website URL'
};

// Activity type to icon mapping
export const activityTypeToIcon: Partial<Record<ActivityType, string>> = {
  // Remove 'login' and 'logout' which are not defined in ActivityType
  'settings_updated': 'settings',
  'password_changed': 'lock',
  'website_added': 'globe',
  'website_removed': 'trash',
  'document_added': 'file-plus',
  'document_removed': 'file-minus',
  'client_created': 'user-plus',
  'client_updated': 'user',
  'client_deleted': 'user-minus',
  'agent_updated': 'bot',
  'widget_updated': 'layout',
  'password_reset': 'key',
  'document_link_added': 'link',
  'document_link_deleted': 'unlink',
  'website_url_added': 'globe',
  'website_url_deleted': 'trash'
};

// Activity type to color mapping
export const activityTypeToColor: Partial<Record<ActivityType, string>> = {
  // Remove 'login' and 'logout' which are not defined in ActivityType
  'settings_updated': 'purple',
  'password_changed': 'yellow',
  'website_added': 'green',
  'website_removed': 'red',
  'document_added': 'green',
  'document_removed': 'red',
  'client_created': 'green',
  'client_updated': 'blue',
  'client_deleted': 'red',
  'agent_updated': 'purple',
  'widget_updated': 'blue',
  'password_reset': 'yellow',
  'document_link_added': 'green',
  'document_link_deleted': 'red',
  'website_url_added': 'green',
  'website_url_deleted': 'red'
};
