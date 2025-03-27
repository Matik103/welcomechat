
// We're using string literals directly instead of enums now
type ActivityIconMapping = {
  [key: string]: string;
};

type ActivityColorMapping = {
  [key: string]: string;
};

export const activityTypeToIcon: ActivityIconMapping = {
  // Client activities
  'client_created': 'user-plus',
  'client_updated': 'edit',
  'client_deleted': 'trash',
  
  // Agent activities
  'agent_created': 'bot',
  'agent_updated': 'edit',
  'agent_deleted': 'trash',
  
  // Document activities
  'document_added': 'file-plus',
  'document_updated': 'file-check',
  'document_deleted': 'file-minus',
  'document_processed': 'file-check',
  'document_processing_failed': 'file-warning',
  
  // Website activities
  'website_url_added': 'globe',
  'website_url_updated': 'globe',
  'website_url_deleted': 'trash',
  'website_url_processed': 'check',
  
  // System activities
  'system_update': 'settings',
  'system_error': 'alert-circle',
  
  // Auth activities
  'login_successful': 'log-in',
  'login_failed': 'alert-circle',
  'logout': 'log-out',
  'password_changed': 'key',
  'password_reset_requested': 'key',
  
  // Default icon
  'default': 'message-square'
};

export const activityTypeToColor: ActivityColorMapping = {
  // Client activities
  'client_created': 'green',
  'client_updated': 'blue',
  'client_deleted': 'red',
  
  // Agent activities
  'agent_created': 'indigo',
  'agent_updated': 'indigo',
  'agent_deleted': 'red',
  
  // Document activities
  'document_added': 'blue',
  'document_updated': 'blue',
  'document_deleted': 'red',
  'document_processed': 'green',
  'document_processing_failed': 'red',
  
  // Website activities
  'website_url_added': 'purple',
  'website_url_updated': 'purple',
  'website_url_deleted': 'red',
  'website_url_processed': 'green',
  
  // System activities
  'system_update': 'amber',
  'system_error': 'red',
  
  // Auth activities
  'login_successful': 'green',
  'login_failed': 'red',
  'logout': 'gray',
  'password_changed': 'blue',
  'password_reset_requested': 'amber',
  
  // Default color
  'default': 'gray'
};

// Get a human-readable label for an activity type
export const getActivityTypeLabel = (type: string): string => {
  // Convert snake_case to Title Case
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
