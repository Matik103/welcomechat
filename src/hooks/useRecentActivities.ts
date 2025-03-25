
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLogEntry, ActivityType } from '@/types/activity';

export function useRecentActivities(limit: number = 5, clientId?: string) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('client_activities')
        .select(`
          id,
          client_id,
          activity_type,
          description,
          metadata,
          created_at,
          ai_agents:client_id(client_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error: apiError } = await query;

      if (apiError) throw apiError;

      // Transform the data to the expected format with client names
      const transformedActivities: ActivityLogEntry[] = data?.map((activity: any) => {
        let clientName: string | undefined;
        
        // Try to get client name from the join
        if (activity.ai_agents) {
          clientName = activity.ai_agents.client_name;
        }
        
        return {
          id: activity.id,
          client_id: activity.client_id,
          activity_type: activity.activity_type as ActivityType,
          description: activity.description || '',
          metadata: activity.metadata,
          created_at: activity.created_at,
          client_name: clientName,
          ai_agents: activity.ai_agents
        };
      }) || [];

      setActivities(transformedActivities);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch recent activities'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [clientId, limit]);

  return {
    activities,
    isLoading,
    error,
    refresh: fetchActivities
  };
}
