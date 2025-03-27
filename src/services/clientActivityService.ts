import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/client-form';
import { Json } from '@/integrations/supabase/types';
import { Database } from '@/integrations/supabase/types';

type DatabaseActivityType = Database['public']['Enums']['activity_type_enum'];

interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: DatabaseActivityType;
  description: string;
  metadata?: Json;
  created_at: string;
  updated_at: string;
}

// Map our application activity types to database activity types
const activityTypeMap: Record<ActivityType, DatabaseActivityType> = {
  'client_created': 'client_created',
  'client_updated': 'client_updated',
  'client_deleted': 'client_deleted',
  'client_recovered': 'client_recovered',
  'widget_settings_updated': 'widget_settings_updated',
  'website_url_added': 'website_url_added',
  'website_url_deleted': 'website_url_deleted',
  'website_url_processed': 'website_url_processed',
  'document_uploaded': 'document_uploaded',
  'document_processed': 'document_processed',
  'document_processing_failed': 'document_processing_failed',
  'document_processing_started': 'document_processing_started',
  'document_processing_completed': 'document_processing_completed',
  'document_link_added': 'document_link_added',
  'document_link_deleted': 'document_link_deleted',
  'document_link_removed': 'document_link_deleted',
  'document_added': 'document_stored',
  'document_removed': 'document_link_deleted',
  'chat_interaction': 'chat_interaction',
  'ai_agent_created': 'ai_agent_created',
  'ai_agent_updated': 'ai_agent_updated',
  'error_logged': 'error_logged',
  'system_update': 'system_update',
  'login_success': 'login_success',
  'login_failed': 'login_failed',
  'logo_uploaded': 'logo_uploaded',
  'embed_code_copied': 'embed_code_copied',
  'source_added': 'source_added',
  'source_deleted': 'source_deleted',
  'ai_agent_table_created': 'ai_agent_table_created',
  'signed_out': 'signed_out',
  'email_sent': 'email_sent',
  'openai_assistant_document_added': 'openai_assistant_document_added',
  'config_updated': 'system_update',
  'agent_updated': 'agent_updated',
  'widget_updated': 'widget_settings_updated',
  'agent_error': 'agent_error',
  'settings_updated': 'system_update',
  'login': 'login_success',
  'logout': 'signed_out',
  'website_added': 'website_url_added',
  'website_removed': 'website_url_deleted'
};

export const createClientActivity = async (
  clientId: string,
  activity_type: ActivityType,
  description: string,
  metadata?: Json
): Promise<ClientActivity | null> => {
  try {
    const mappedActivityType = activityTypeMap[activity_type];
    if (!mappedActivityType) {
      console.error(`Invalid activity type: ${activity_type}`);
      return null;
    }

    const { data, error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: mappedActivityType,
        description,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client activity:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating client activity:', error);
    return null;
  }
};

export const getClientActivities = async (
  clientId: string,
  limit: number = 10
): Promise<ClientActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching client activities:', error);
    return [];
  }
};

export const getActivityStats = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('activity_type, count(*)')
      .eq('client_id', clientId)
      .order('activity_type');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return [];
  }
};

export const getRecentActivities = async (limit: number = 10): Promise<ClientActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

// Helper functions for common activity types
export const createAgentActivity = async (
  clientId: string,
  agentName: string,
  description: string
) => {
  return createClientActivity(
    clientId,
    'ai_agent_created',
    description,
    { agent_name: agentName }
  );
};

export const createDocumentActivity = async (
  clientId: string,
  documentName: string,
  activityType: ActivityType = 'document_processed'
) => {
  return createClientActivity(
    clientId,
    activityType,
    `Document ${documentName} was ${activityType.replace('document_', '')}`,
    { document_name: documentName }
  );
};
