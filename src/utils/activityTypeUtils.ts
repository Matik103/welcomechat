
/**
 * Returns a user-friendly label for an activity type
 */
export function getActivityTypeLabel(type?: string): string {
  if (!type) return 'Unknown Activity';
  
  // Map activity types to user-friendly labels
  const activityLabels: Record<string, string> = {
    // Chat interactions
    'chat_interaction': 'Chat Interaction',
    
    // Client actions
    'client_created': 'Client Created',
    'client_updated': 'Client Updated',
    'client_deleted': 'Client Scheduled for Deletion',
    'client_recovered': 'Client Recovered',
    
    // Agent actions
    'agent_created': 'AI Agent Created',
    'agent_updated': 'AI Agent Updated',
    'agent_deleted': 'AI Agent Deleted',
    'ai_agent_created': 'AI Agent Created',
    'ai_agent_updated': 'AI Agent Updated',
    
    // Website & document actions
    'website_url_added': 'Website URL Added',
    'url_deleted': 'Website URL Deleted',
    'drive_link_added': 'Google Drive Link Added',
    'drive_link_deleted': 'Google Drive Link Deleted',
    'document_added': 'Document Added',
    'document_removed': 'Document Removed',
    'document_processed': 'Document Processed',
    'document_processing_failed': 'Document Processing Failed',
    
    // System actions
    'email_sent': 'Email Sent',
    'email_error': 'Email Error',
    'system_update': 'System Update',
    
    // User actions
    'invitation_sent': 'Invitation Sent',
    'invitation_accepted': 'Invitation Accepted',
    'widget_settings_updated': 'Widget Settings Updated'
  };
  
  return activityLabels[type] || type.replace(/_/g, ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Maps activity types to icon names
 */
export const activityTypeToIcon: Record<string, string> = {
  // Chat interactions
  'chat_interaction': 'message-square',
  
  // Client actions
  'client_created': 'user-plus',
  'client_updated': 'edit',
  'client_deleted': 'trash',
  'client_recovered': 'rotate-ccw',
  
  // Agent actions
  'agent_created': 'bot',
  'agent_updated': 'edit',
  'agent_deleted': 'trash',
  'ai_agent_created': 'bot',
  'ai_agent_updated': 'edit',
  
  // Website & document actions
  'website_url_added': 'globe',
  'url_deleted': 'trash',
  'drive_link_added': 'link',
  'drive_link_deleted': 'link',
  'document_added': 'file-plus',
  'document_removed': 'file-minus',
  'document_processed': 'file-check',
  'document_processing_failed': 'file-warning',
  
  // System actions
  'email_sent': 'mail',
  'email_error': 'alert-circle',
  'system_update': 'settings',
  
  // User actions
  'invitation_sent': 'mail',
  'invitation_accepted': 'check-circle',
  'widget_settings_updated': 'layout',
  
  // Default
  'default': 'users'
};

/**
 * Maps activity types to color names (for Tailwind classes)
 */
export const activityTypeToColor: Record<string, string> = {
  // Chat interactions
  'chat_interaction': 'purple',
  
  // Client actions
  'client_created': 'green',
  'client_updated': 'blue',
  'client_deleted': 'red',
  'client_recovered': 'green',
  
  // Agent actions
  'agent_created': 'indigo',
  'agent_updated': 'indigo',
  'agent_deleted': 'red',
  'ai_agent_created': 'indigo',
  'ai_agent_updated': 'indigo',
  
  // Website & document actions
  'website_url_added': 'blue',
  'url_deleted': 'red',
  'drive_link_added': 'blue',
  'drive_link_deleted': 'red',
  'document_added': 'blue',
  'document_removed': 'red',
  'document_processed': 'green',
  'document_processing_failed': 'yellow',
  
  // System actions
  'email_sent': 'blue',
  'email_error': 'red',
  'system_update': 'gray',
  
  // User actions
  'invitation_sent': 'blue',
  'invitation_accepted': 'green',
  'widget_settings_updated': 'blue',
  
  // Default
  'default': 'gray'
};
