
import { ActivityType } from '@/types/client-form';

// Map activity types to icon names
export const activityTypeToIcon: Record<string, string> = {
  'login': 'log-in',
  'logout': 'log-out',
  'settings_updated': 'settings',
  'password_changed': 'key',
  'website_added': 'globe',
  'website_removed': 'trash',
  'document_added': 'file-plus',
  'document_removed': 'file-minus',
  'client_created': 'user-plus',
  'client_updated': 'user',
  'client_deleted': 'user-x',
  'agent_created': 'bot',
  'agent_updated': 'bot',
  'ai_agent_created': 'bot',
  'ai_agent_updated': 'bot',
  'widget_updated': 'layout',
  'password_reset': 'key',
  'document_link_added': 'link',
  'document_link_deleted': 'link-2',
  'document_link_removed': 'link-2',
  'website_url_added': 'globe',
  'website_url_deleted': 'trash',
  'website_url_processed': 'check-circle',
  'url_added': 'link',
  'url_removed': 'trash',
  'url_processed': 'check-circle',
  'url_processing_failed': 'alert-circle',
  'document_processed': 'file-check',
  'document_processing_failed': 'file-warning'
};

// Map activity types to color schemes
export const activityTypeToColor: Record<string, string> = {
  'login': 'green',
  'logout': 'gray',
  'settings_updated': 'blue',
  'password_changed': 'purple',
  'website_added': 'indigo',
  'website_removed': 'red',
  'document_added': 'cyan',
  'document_removed': 'orange',
  'client_created': 'emerald',
  'client_updated': 'blue',
  'client_deleted': 'red',
  'agent_created': 'indigo',
  'agent_updated': 'violet',
  'ai_agent_created': 'indigo',
  'ai_agent_updated': 'violet',
  'widget_updated': 'amber',
  'password_reset': 'purple',
  'document_link_added': 'cyan',
  'document_link_deleted': 'orange',
  'document_link_removed': 'orange',
  'website_url_added': 'indigo',
  'website_url_deleted': 'red',
  'website_url_processed': 'green',
  'url_added': 'cyan',
  'url_removed': 'red',
  'url_processed': 'green',
  'url_processing_failed': 'red',
  'document_processed': 'green',
  'document_processing_failed': 'red'
};

// Convert activity type to human-readable label
export const getActivityTypeLabel = (type: string): string => {
  // Map specific activity types to custom labels if needed
  const customLabels: Record<string, string> = {
    'agent_created': 'AI Agent Created',
    'agent_updated': 'AI Agent Updated',
    'ai_agent_created': 'AI Agent Created',
    'ai_agent_updated': 'AI Agent Updated',
    'document_link_removed': 'Document Link Removed'
  };

  if (customLabels[type]) {
    return customLabels[type];
  }

  // Convert from snake_case to Title Case with spaces
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
