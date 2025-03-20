
import { Json } from "@/integrations/supabase/types";

// Export ExtendedActivityType properly with 'export type'
export type { ExtendedActivityType } from "./extended-supabase";

/**
 * Type definition for activity types
 */
export type ActivityType = 
  | 'chat_interaction'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'client_recovered'
  | 'widget_settings_updated'
  | 'website_url_added'
  | 'website_url_deleted'
  | 'website_url_processed'
  | 'drive_link_added'
  | 'drive_link_deleted'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'document_uploaded'
  | 'document_processed'
  | 'document_stored'
  | 'document_processing_started'
  | 'document_processing_completed'
  | 'document_processing_failed'
  | 'error_logged'
  | 'common_query_milestone'
  | 'interaction_milestone'
  | 'growth_milestone'
  | 'webhook_sent'
  | 'ai_agent_created'
  | 'agent_name_updated'
  | 'agent_description_updated'
  | 'signed_out'
  | 'embed_code_copied'
  | 'logo_uploaded'
  | 'system_update'
  | 'source_deleted'
  | 'source_added'
  | 'url_deleted'
  | 'ai_agent_table_created';

/**
 * Interface for client activity
 */
export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType;
  description: string;
  metadata?: Json;
  created_at: string;
}

/**
 * Interface for activity log props
 */
export interface ActivityLogProps {
  activities: ClientActivity[];
  isLoading: boolean;
}

/**
 * Interface for activity item props
 */
export interface ActivityItemProps {
  activity: ClientActivity;
}

// Client status enum
export type ClientStatus = 'active' | 'inactive' | 'pending' | 'deleted';
