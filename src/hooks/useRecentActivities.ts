
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ClientActivity = {
  id: string;
  type: string;
  ai_agent_id: string;
  created_at: string;
  metadata?: Record<string, any>;
  client_name?: string;
};

export function useRecentActivities(limit: number = 10) {
  const [activities, setActivities] = useState<ClientActivity[]>([]);

  const fetchRecentActivities = async (): Promise<ClientActivity[]> => {
    console.log(`Fetching recent activities, limit: ${limit}`);
    
    try {
      // Get activities from client_activities or activities table
      const { data: activityData, error: activityError } = await supabase
        .from('client_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (activityError) {
        console.error('Error fetching activities:', activityError);
        throw new Error(activityError.message);
      }
      
      // Fetch client names for each activity
      if (activityData && activityData.length > 0) {
        const clientIds = [...new Set(activityData.map(a => a.client_id))];
        
        // Get client names
        const { data: clientData, error: clientError } = await supabase
          .from('ai_agents')
          .select('id, client_name')
          .in('id', clientIds)
          .eq('interaction_type', 'config');
          
        if (clientError) {
          console.error('Error fetching client names:', clientError);
        }
        
        // Map client names to activities
        const activitiesWithClientNames = activityData.map(activity => {
          const client = clientData?.find(c => c.id === activity.client_id);
          return {
            ...activity,
            client_name: client?.client_name || `Client ${activity.client_id.substring(0, 8)}`
          };
        });
        
        console.log('Recent activities fetched:', activitiesWithClientNames.length);
        return activitiesWithClientNames;
      }
      
      console.log('Recent activities fetched:', activityData?.length || 0);
      return activityData || [];
    } catch (error) {
      console.error('Error in fetchRecentActivities:', error);
      throw error;
    }
  };

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['recentActivities', limit],
    queryFn: fetchRecentActivities,
    onSuccess: (data) => {
      setActivities(data);
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false
  });

  return {
    activities,
    isLoading,
    error,
    refetch: refetch
  };
}
