
import { ActivityType } from '@/types/client-form';

// Activity type to display text mapping
export const activityTypeToDisplayText: Partial<Record<ActivityType, string>> = {
  'password_changed': 'Changed password',
  'website_url_added': 'Added website URL',
  'website_url_deleted': 'Deleted website URL',
  'website_url_processed': 'Processed website URL',
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
  'url_added': 'Added URL',           // Legacy type
  'url_removed': 'Removed URL',       // Legacy type
  'url_processed': 'Processed URL',   // Legacy type
  'url_processing_failed': 'URL processing failed', // Legacy type
  'document_processed': 'Document processed',
  'document_processing_failed': 'Document processing failed',
  'settings_updated': 'Settings updated',
  'login': 'Logged in',
  'logout': 'Logged out',
  'website_added': 'Website added',
  'website_removed': 'Website removed',
  'chat_interaction': 'Chat interaction',
  'agent_error': 'Agent error',
  'system_update': 'System update',
  'document_processing_started': 'Document processing started',
  'document_processing_completed': 'Document processing completed',
  'agent_name_updated': 'Agent name updated',
  'agent_description_updated': 'Agent description updated',
  'agent_logo_updated': 'Agent logo updated',
  'logo_uploaded': 'Logo uploaded',
  'drive_link_added': 'Drive link added',
  'drive_link_deleted': 'Drive link deleted',
  'client_recovered': 'Client recovered',
  'webhook_sent': 'Webhook sent',
  'error_logged': 'Error logged',
  'interaction_milestone': 'Interaction milestone',
  'growth_milestone': 'Growth milestone',
  'invitation_sent': 'Invitation sent',
  'invitation_accepted': 'Invitation accepted'
};

// Activity type to icon mapping
export const activityTypeToIcon: Partial<Record<ActivityType, string>> = {
  'password_changed': 'lock',
  'website_url_added': 'globe',
  'website_url_deleted': 'trash',
  'website_url_processed': 'check-circle',
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
  'url_added': 'globe',           // Legacy type
  'url_removed': 'trash',         // Legacy type
  'url_processed': 'check-circle',   // Legacy type
  'url_processing_failed': 'alert-circle', // Legacy type
  'document_processed': 'file-check',
  'document_processing_failed': 'file-alert',
  'settings_updated': 'settings',
  'login': 'log-in',
  'logout': 'log-out',
  'website_added': 'globe',
  'website_removed': 'trash',
  'chat_interaction': 'message-square',
  'agent_error': 'alert-circle',
  'system_update': 'refresh-cw',
  'document_processing_started': 'loader',
  'document_processing_completed': 'check',
  'agent_name_updated': 'edit',
  'agent_description_updated': 'edit-3',
  'agent_logo_updated': 'image',
  'logo_uploaded': 'upload',
  'drive_link_added': 'link',
  'drive_link_deleted': 'unlink',
  'client_recovered': 'rotate-ccw',
  'webhook_sent': 'send',
  'error_logged': 'alert-triangle',
  'interaction_milestone': 'award',
  'growth_milestone': 'trending-up',
  'invitation_sent': 'mail',
  'invitation_accepted': 'check'
};

// Activity type to color mapping
export const activityTypeToColor: Partial<Record<ActivityType, string>> = {
  'password_changed': 'yellow',
  'website_url_added': 'green',
  'website_url_deleted': 'red',
  'website_url_processed': 'blue',
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
  'url_added': 'green',           // Legacy type
  'url_removed': 'red',           // Legacy type
  'url_processed': 'blue',        // Legacy type
  'url_processing_failed': 'orange', // Legacy type
  'document_processed': 'green',
  'document_processing_failed': 'orange',
  'settings_updated': 'blue',
  'login': 'green',
  'logout': 'gray',
  'website_added': 'green',
  'website_removed': 'red',
  'chat_interaction': 'purple',
  'agent_error': 'red',
  'system_update': 'blue',
  'document_processing_started': 'blue',
  'document_processing_completed': 'green',
  'agent_name_updated': 'blue',
  'agent_description_updated': 'blue',
  'agent_logo_updated': 'blue',
  'logo_uploaded': 'purple',
  'drive_link_added': 'green',
  'drive_link_deleted': 'red',
  'client_recovered': 'green',
  'webhook_sent': 'blue',
  'error_logged': 'red',
  'interaction_milestone': 'yellow',
  'growth_milestone': 'green',
  'invitation_sent': 'blue',
  'invitation_accepted': 'green'
};
