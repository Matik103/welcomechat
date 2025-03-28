export interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  description: string;
  created_at: string;
  metadata: any;
  type?: string;
}

export interface ClientActivityProps {
  activities: ClientActivity[];
  isLoading: boolean;
  className?: string;
}

export type ClientStatus = 'active' | 'inactive' | 'deleted';

// Define activity types that match the database enum
export type ActivityType = 
  | 'document_added'
  | 'document_removed'
  | 'document_processed'
  | 'document_processing_failed'
  | 'url_added'
  | 'url_removed'
  | 'url_processed'
  | 'url_processing_failed'
  | 'chat_message_sent'
  | 'chat_message_received';

// This approach prevents us from trying to use potentially invalid enum values
// by entirely avoiding database inserts for activities
