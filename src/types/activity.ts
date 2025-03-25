
import { Json } from '@/types/supabase';

export type ActivityType = 
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'document_added'
  | 'document_processed'
  | 'document_processing_failed'
  | 'chat_interaction'
  | 'chat_message_received'
  | 'document_link_added'
  | 'document_link_deleted'
  | 'signed_out'
  | 'embed_code_copied';

// For backward compatibility
export type ExtendedActivityType = ActivityType;

export interface ActivityLogEntry {
  id: string;
  client_id: string;
  activity_type: ActivityType;
  description?: string;
  metadata?: Json;
  created_at?: string;
  client_name?: string;
  ai_agents?: {
    client_name?: string;
  };
}

export interface ActivityWithClientInfo extends ActivityLogEntry {
  client_name: string;
}
