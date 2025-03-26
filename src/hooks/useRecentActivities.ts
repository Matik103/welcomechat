
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClientActivity } from '@/types/activity';

export const useRecentActivities = (clientId?: string) => {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('client_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Add client filter if specified
      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        setError(new Error(`Failed to fetch activities: ${error.message}`));
        return;
      }

      if (!data) {
        setActivities([]);
        return;
      }

      // Process the activities and convert to ClientActivity objects
      const processedActivities: ClientActivity[] = data.map((activity) => ({
        id: activity.id,
        client_id: activity.client_id,
        activity_type: activity.activity_type,
        description: activity.description || '',
        created_at: activity.created_at,
        metadata: activity.activity_data || {},
      }));

      setActivities(processedActivities);
    } catch (err) {
      console.error('Error in fetchActivities:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [clientId]);

  const refetch = async () => {
    await fetchActivities();
  };

  return {
    activities,
    isLoading,
    error,
    refetch
  };
};
