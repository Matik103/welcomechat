import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export enum ActivityType {
  LOGIN = 'login',
  AGENT_CREATED = 'agent_created',
  AGENT_UPDATED = 'agent_updated',
  AGENT_DELETED = 'agent_deleted',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  DOCUMENT_PROCESSED = 'document_processed',
  URL_ADDED = 'url_added',
  URL_REMOVED = 'url_removed',
  URL_PROCESSED = 'url_processed'
}

export async function createClientActivity(
  clientId: string,
  agentName?: string | undefined,
  activityType: string = 'general',
  description: string = '',
  metadata: Record<string, any> = {}
) {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .insert([
        {
          id: uuidv4(),
          client_id: clientId,
          agent_name: agentName || null,
          activity_type: activityType,
          description: description,
          metadata: metadata || {}
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating client activity:', error);
      throw new Error(error.message || 'Failed to create client activity');
    }

    return data;
  } catch (error: any) {
    console.error('Error in createClientActivity:', error);
    if (error?.message?.includes('Foreign key violation')) {
      throw new Error('Invalid client ID provided');
    }
    throw error;
  }
}

export async function logClientActivity(
  clientId: string, 
  activity: string, 
  details?: Record<string, any>
): Promise<void> {
  try {
    await createClientActivity(
      clientId,
      undefined,
      'general',
      activity,
      details || {}
    );
  } catch (error: any) {
    console.error('Error logging client activity:', error);
    throw new Error(error.message || 'Failed to log client activity');
  }
}
