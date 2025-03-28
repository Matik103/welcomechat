import { ActivityType } from '@/types/activity';

// Map activity types to icon names
export const activityTypeIcons: Record<string, string> = {
  'document_added': 'file-plus',
  'document_removed': 'file-minus',
  'document_processed': 'check-circle',
  'document_processing_failed': 'x-circle',
  'url_added': 'globe',
  'url_removed': 'globe-off',
  'url_processed': 'check-circle',
  'url_processing_failed': 'x-circle',
  'chat_message_sent': 'message-square',
  'chat_message_received': 'message-circle'
};

// Map activity types to colors
export const activityTypeColors: Record<string, string> = {
  'document_added': 'emerald',
  'document_removed': 'red',
  'document_processed': 'green',
  'document_processing_failed': 'red',
  'url_added': 'sky',
  'url_removed': 'red',
  'url_processed': 'green',
  'url_processing_failed': 'red',
  'chat_message_sent': 'blue',
  'chat_message_received': 'indigo'
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
