
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/activity';

export async function createClientActivity(
  clientId: string,
  agentName?: string,
  activityType: string = 'page_view', // Changed from ActivityType.PAGE_VIEW to a string literal
  description: string = 'User viewed page',
  activityData: Record<string, any> = {}
): Promise<void> {
  if (!clientId) {
    console.error('Client ID is required for activity logging');
    throw new Error('Client ID is required');
  }

  try {
    console.log(`Logging activity for client ${clientId}:`, {
      type: activityType,
      description: description,
      data: activityData
    });

    // Instead of using the standard client, we'll use a function call to log the activity
    // This will bypass RLS since the function can be set up with SECURITY DEFINER
    const { error } = await supabase.rpc('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: activityType,
      description_param: description,
      metadata_param: {
        ...activityData,
        agent_name: agentName,
        date: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Error creating client activity:', error);
      throw error;
    }

    return;
  } catch (error) {
    console.error('Failed to log client activity:', error);
    throw error;
  }
}

export async function getRecentClientActivities(
  clientId: string,
  limit: number = 10
) {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching client activities:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch client activities:', error);
    throw error;
  }
}
