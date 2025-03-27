
// Utility functions for activity types

// Map activity types to icon names
export const activityTypeToIcon: Record<string, string> = {
  client_created: 'user-plus',
  client_updated: 'edit',
  client_deleted: 'trash',
  agent_created: 'bot',
  agent_updated: 'edit',
  document_uploaded: 'file-plus',
  document_added: 'file-plus',
  document_link_added: 'link',
  document_link_removed: 'file-minus',
  website_url_added: 'globe',
  website_url_removed: 'trash',
  chat_interaction: 'message-square',
  client_login: 'log-in',
  client_logout: 'log-out',
  password_reset: 'key',
  error: 'alert-circle',
  client_activity: 'activity',
  unknown: 'help-circle'
};

// Map activity types to colors
export const activityTypeToColor: Record<string, string> = {
  client_created: 'green',
  client_updated: 'blue',
  client_deleted: 'red',
  agent_created: 'indigo',
  agent_updated: 'purple',
  document_uploaded: 'blue',
  document_added: 'blue',
  document_link_added: 'blue',
  document_link_removed: 'amber',
  website_url_added: 'cyan',
  website_url_removed: 'amber',
  chat_interaction: 'violet',
  client_login: 'green',
  client_logout: 'gray',
  password_reset: 'amber',
  error: 'red',
  client_activity: 'gray',
  unknown: 'gray'
};

// Get a readable label for an activity type
export const getActivityTypeLabel = (activityType: string): string => {
  // Convert snake_case to Title Case with spaces
  return activityType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
