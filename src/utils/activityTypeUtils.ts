
import { ExtendedActivityType } from "@/types/extended-supabase";

/**
 * Maps activity types to user-friendly descriptions
 */
export const getActivityDescription = (activityType: ExtendedActivityType): string => {
  const activityDescriptions: Record<ExtendedActivityType, string> = {
    'chat_interaction': 'Chat interaction',
    'client_created': 'Client created',
    'client_updated': 'Client updated',
    'client_deleted': 'Client deleted',
    'client_recovered': 'Client recovered',
    'widget_settings_updated': 'Widget settings updated',
    'website_url_added': 'Website URL added',
    'website_url_deleted': 'Website URL deleted',
    'website_url_processed': 'Website processed',
    'drive_link_added': 'Drive link added',
    'drive_link_deleted': 'Drive link deleted',
    'document_link_added': 'Document link added',
    'document_link_deleted': 'Document link deleted',
    'document_uploaded': 'Document uploaded',
    'document_processed': 'Document processed',
    'document_stored': 'Document stored',
    'document_processing_started': 'Document processing started',
    'document_processing_completed': 'Document processing completed',
    'document_processing_failed': 'Document processing failed',
    'error_logged': 'Error occurred',
    'common_query_milestone': 'Common query milestone',
    'interaction_milestone': 'Interaction milestone',
    'growth_milestone': 'Growth milestone',
    'webhook_sent': 'Webhook sent',
    'ai_agent_created': 'AI agent created',
    'agent_name_updated': 'Agent name updated',
    'signed_out': 'User signed out',
    'embed_code_copied': 'Embed code copied',
    'logo_uploaded': 'Logo uploaded',
    'system_update': 'System update',
    'source_deleted': 'Source deleted',
    'source_added': 'Source added'
  };

  return activityDescriptions[activityType] || 'Unknown activity';
};

/**
 * Groups activity types into categories
 */
export const getActivityCategory = (activityType: ExtendedActivityType): 'user' | 'system' | 'data' | 'interaction' => {
  const userActivities: ExtendedActivityType[] = [
    'client_created',
    'client_updated',
    'client_deleted',
    'client_recovered',
    'widget_settings_updated',
    'signed_out',
    'embed_code_copied',
    'logo_uploaded',
    'ai_agent_created',
    'agent_name_updated'
  ];

  const dataActivities: ExtendedActivityType[] = [
    'website_url_added',
    'website_url_deleted',
    'website_url_processed',
    'drive_link_added',
    'drive_link_deleted',
    'document_link_added',
    'document_link_deleted',
    'document_uploaded',
    'document_processed',
    'document_stored',
    'document_processing_started',
    'document_processing_completed',
    'document_processing_failed',
    'source_deleted',
    'source_added'
  ];

  const interactionActivities: ExtendedActivityType[] = [
    'chat_interaction',
    'common_query_milestone',
    'interaction_milestone',
    'growth_milestone'
  ];

  if (userActivities.includes(activityType)) return 'user';
  if (dataActivities.includes(activityType)) return 'data';
  if (interactionActivities.includes(activityType)) return 'interaction';
  return 'system';
};
