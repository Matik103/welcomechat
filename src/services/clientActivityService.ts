
import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from '@/types/client-form';

export const createClientActivity = async (
  clientId: string,
  activity_type: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('client_activity')
      .insert({
        client_id: clientId,
        activity_type,
        description,
        metadata
      });

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
    const { data, error } = await supabase
      .from('client_activity')
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
