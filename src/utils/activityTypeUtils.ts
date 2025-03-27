
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
