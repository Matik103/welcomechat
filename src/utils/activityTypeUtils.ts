// Map activity types to their corresponding icon names
export const activityTypeToIcon: Record<string, string> = {
  // Client activities
  client_created: 'user-plus',
  client_updated: 'edit',
  client_deleted: 'trash',
  client_recovered: 'rotate-ccw',
  
  // Agent activities
  agent_created: 'bot',
  agent_updated: 'edit',
  agent_deleted: 'trash',
  agent_name_updated: 'edit',
  agent_description_updated: 'edit',
  agent_error: 'alert-circle',
  agent_logo_updated: 'image',
  
  // Document activities
  document_added: 'file-plus',
  document_removed: 'file-minus',
  document_processed: 'file-check',
  document_processing_failed: 'file-warning',
  
  // URL activities
  url_added: 'link',
  url_removed: 'trash',
  url_processed: 'check',
  url_processing_failed: 'alert-circle',
  
  // Chat activities
  chat_interaction: 'message-square',
  chat_message_sent: 'message-square',
  chat_message_received: 'message-square',
  
  // Other activities
  webhook_sent: 'code',
  email_sent: 'mail',
  invitation_sent: 'mail',
  invitation_accepted: 'check-circle',
  widget_previewed: 'eye',
  widget_settings_updated: 'settings',
  user_role_updated: 'users',
  login_success: 'log-in',
  login_failed: 'alert-circle',
  signed_out: 'log-out',
  logo_uploaded: 'image',
  system_update: 'settings',
  source_deleted: 'trash',
  source_added: 'file-plus',
  error_logged: 'alert-circle',
  
  // Default icon
  default: 'info'
};

// Map activity types to color names
export const activityTypeToColor: Record<string, string> = {
  // Client activities
  client_created: 'green',
  client_updated: 'blue',
  client_deleted: 'red',
  client_recovered: 'green',
  
  // Agent activities
  agent_created: 'green',
  agent_updated: 'blue',
  agent_deleted: 'red',
  agent_name_updated: 'blue',
  agent_description_updated: 'blue',
  agent_error: 'red',
  agent_logo_updated: 'blue',
  
  // Document activities
  document_added: 'green',
  document_removed: 'red',
  document_processed: 'green',
  document_processing_failed: 'red',
  
  // URL activities
  url_added: 'green',
  url_removed: 'red',
  url_processed: 'green',
  url_processing_failed: 'red',
  
  // Chat activities
  chat_interaction: 'purple',
  chat_message_sent: 'purple',
  chat_message_received: 'purple',
  
  // Other activities
  webhook_sent: 'blue',
  email_sent: 'indigo',
  invitation_sent: 'indigo',
  invitation_accepted: 'green',
  widget_previewed: 'blue',
  widget_settings_updated: 'blue',
  user_role_updated: 'blue',
  login_success: 'green',
  login_failed: 'red',
  signed_out: 'amber',
  logo_uploaded: 'blue',
  system_update: 'indigo',
  source_added: 'green',
  source_deleted: 'red',
  error_logged: 'red',
  
  // Default color
  default: 'gray'
};

// Get a user-friendly label for activity types
export const getActivityTypeLabel = (type: string = 'unknown'): string => {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Safe conversion of activity types for database operations
export const getSafeActivityType = (type: string): string => {
  // Make sure the type only contains lowercase letters, numbers, and underscores
  return type.toLowerCase().replace(/[^a-z0-9_]/g, '_');
};
