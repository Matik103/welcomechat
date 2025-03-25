
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityWithClientInfo } from '@/types/activity';

export const useRecentActivities = (limit: number = 10) => {
  const [activities, setActivities] = useState<ActivityWithClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query joined data from client_activities and ai_agents
        const { data, error } = await supabase
          .from('client_activities')
          .select(`
            *,
            ai_agents:client_id(id, client_name)
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Transform the data to match ActivityWithClientInfo
        const transformedActivities: ActivityWithClientInfo[] = data.map(item => {
          // Extract client info from joined data
          const clientInfo = item.ai_agents as any;
          const clientName = clientInfo?.client_name || 'Unknown Client';
          
          // Get description from activity_data if available
          const description = item.activity_data?.description || undefined;
          const metadata = item.activity_data?.metadata || undefined;

          return {
            id: item.id,
            activity_type: item.activity_type,
            description: description,
            created_at: item.created_at,
            client_id: item.client_id,
            client_name: clientName,
            metadata: metadata
          };
        });

        setActivities(transformedActivities);
      } catch (err) {
        console.error('Error fetching recent activities:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [limit]);

  return { activities, isLoading, error };
};
