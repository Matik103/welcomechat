
import { ActivityType } from '@/types/activity';

// Map activity types to icon names
export const activityTypeToIcon: Record<string, string> = {
  'chat_interaction': 'message-square',
  'client_created': 'user-plus',
  'client_updated': 'edit',
  'client_deleted': 'trash',
  'client_recovered': 'rotate-ccw',
  'ai_agent_created': 'bot',
  'ai_agent_updated': 'edit',
  'ai_agent_deleted': 'trash',
  'website_url_added': 'globe',
  'website_url_deleted': 'trash',
  'document_link_added': 'link',
  'document_link_deleted': 'link',
  'document_uploaded': 'file-plus',
  'login_success': 'log-in',
  'login_failed': 'alert-circle',
  'error_logged': 'alert-circle',
  'unknown': 'help-circle'
};

// Map activity types to colors
export const activityTypeToColor: Record<string, string> = {
  'chat_interaction': 'purple',
  'client_created': 'green',
  'client_updated': 'blue',
  'client_deleted': 'red',
  'client_recovered': 'amber',
  'ai_agent_created': 'indigo',
  'ai_agent_updated': 'blue',
  'ai_agent_deleted': 'red',
  'website_url_added': 'sky',
  'website_url_deleted': 'red',
  'document_link_added': 'emerald',
  'document_link_deleted': 'red',
  'document_uploaded': 'emerald',
  'login_success': 'green',
  'login_failed': 'red',
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
