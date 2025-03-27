
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/client-form';
import { Json } from '@/integrations/supabase/types';

export const createClientActivity = async (
  clientId: string,
  activity_type: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Map activity types that might not be in the enum to valid ones
    let validActivityType = activity_type;
    
    // Check if the activity type needs to be mapped to a valid enum value
    if (activity_type === 'agent_created') {
      validActivityType = 'ai_agent_created';
    } else if (activity_type === 'agent_updated') {
      validActivityType = 'ai_agent_updated';
    }
    
    // Use client_activities table name
    const { error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: validActivityType as string,
        description,
        metadata
      } as any);

    if (error) {
      console.error('Error creating client activity:', error);
    }
  } catch (error) {
    console.error('Error creating client activity:', error);
  }
};

export const getClientActivities = async (
  clientId: string,
  limit: number = 10
) => {
  try {
    // Use client_activities table name
    const { data, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching client activities:', error);
    return [];
  }
};
