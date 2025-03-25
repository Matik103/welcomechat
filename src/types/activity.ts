
import { Json } from "@/integrations/supabase/types";

export type ActivityType = 
  | 'client_created'
  | 'client_updated' 
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_settings_updated'
  | 'website_url_added'
  | 'website_url_deleted'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_uploaded'
  | 'document_processed'
  | 'document_processing_failed'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'chat_interaction'
  | 'agent_name_updated'
  | 'agent_logo_updated'
  | 'agent_description_updated'
  | 'ai_agent_created'
  | 'ai_agent_updated'
  | 'error_logged'
  | 'webhook_sent'
  | 'system_update'
  | 'common_query_milestone'
  | 'interaction_milestone'
  | 'growth_milestone'
  | 'invitation_sent'
  | 'invitation_accepted'
  | 'user_role_updated'
  | 'login_success'
  | 'login_failed'
  | 'logo_uploaded'
  | 'ai_agent_table_created'
  | 'source_added'
  | 'source_deleted'
  | 'client_logo_removed'
  | 'openai_assistant_document_added'
  | 'openai_assistant_upload_failed'
  | 'schema_update';

// For backward compatibility with any old code
export type ExtendedActivityType = ActivityType;

export interface ActivityLogEntry {
  id: string;
  client_id: string;
  activity_type: ActivityType;
  description?: string;
  metadata?: Json;
  created_at: string;
  ai_agents?: {
    client_name?: string;
  } | null;
  client_name?: string;
}

export interface ActivityWithClientInfo extends ActivityLogEntry {
  client_name: string;
}

export const getActivityIcon = (activityType: ActivityType): string => {
  // Map activity types to icons (e.g., 'client_created' -> 'user-plus')
  const iconMap: Record<ActivityType, string> = {
    'client_created': 'user-plus',
    'client_updated': 'edit',
    'client_deleted': 'user-minus',
    'client_recovered': 'refresh-cw',
    'widget_settings_updated': 'settings',
    'website_url_added': 'link',
    'website_url_deleted': 'link-2',
    'drive_link_added': 'file',
    'drive_link_deleted': 'file-minus',
    'document_uploaded': 'upload',
    'document_processed': 'check-circle',
    'document_processing_failed': 'alert-triangle',
    'document_processing_started': 'loader',
    'document_processing_completed': 'check-circle',
    'chat_interaction': 'message-circle',
    'agent_name_updated': 'edit-2',
    'agent_logo_updated': 'image',
    'agent_description_updated': 'align-left',
    'ai_agent_created': 'plus-circle',
    'ai_agent_updated': 'edit',
    'error_logged': 'alert-triangle',
    'webhook_sent': 'send',
    'system_update': 'refresh-cw',
    'common_query_milestone': 'award',
    'interaction_milestone': 'bar-chart-2',
    'growth_milestone': 'trending-up',
    'invitation_sent': 'mail',
    'invitation_accepted': 'user-check',
    'user_role_updated': 'users',
    'login_success': 'log-in',
    'login_failed': 'x-circle',
    'logo_uploaded': 'upload-cloud',
    'ai_agent_table_created': 'database',
    'source_added': 'plus',
    'source_deleted': 'trash',
    'client_logo_removed': 'image-off',
    'openai_assistant_document_added': 'file-plus',
    'openai_assistant_upload_failed': 'alert-octagon',
    'schema_update': 'database'
  };
  
  return iconMap[activityType] || 'activity';
};

export const getActivityColor = (activityType: ActivityType): string => {
  if (activityType.includes('created') || activityType.includes('added') || activityType.includes('success')) {
    return 'text-green-500';
  } else if (activityType.includes('deleted') || activityType.includes('failed') || activityType.includes('error')) {
    return 'text-red-500';
  } else if (activityType.includes('updated') || activityType.includes('processed')) {
    return 'text-blue-500';
  } else {
    return 'text-gray-500';
  }
};
