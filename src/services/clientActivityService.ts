
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/activity';

export const createClientActivity = async (
  clientId: string,
  agentName: string,
  type: ActivityType,
  description: string,
  metadata: Record<string, any> = {}
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: type,
        description,
        activity_data: {
          ...metadata,
          agent_name: agentName,
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Error creating client activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception creating client activity:', error);
    return false;
  }
};

export const getClientActivities = async (
  clientId: string,
  limit = 10
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching client activities:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching client activities:', error);
    return [];
  }
};
