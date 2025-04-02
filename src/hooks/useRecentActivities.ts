
import { useState, useEffect } from 'react';
import { ClientActivity } from '@/types/activity';
import { getRecentActivities } from '@/services/activitiesService';
import { supabase } from '@/integrations/supabase/client';

export const useRecentActivities = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activities, setActivities] = useState<ClientActivity[]>([]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get recent activities from the service
      const { success, data, error: serviceError } = await getRecentActivities(20);
      
      if (!success || serviceError) {
        throw new Error(serviceError?.message || 'Failed to fetch activities');
      }
      
      // Transform data if needed
      const formattedActivities = data?.map(activity => ({
        id: activity.id,
        client_id: activity.ai_agent_id || activity.metadata?.client_id, // Get client_id from ai_agent_id field or metadata
        client_name: activity.metadata?.client_name,
        description: activity.description,
        created_at: activity.created_at,
        metadata: activity.metadata,
        type: activity.type
      })) || [];
      
      // If successful but empty, just set empty array
      setActivities(formattedActivities);
      return formattedActivities;
    } catch (err) {
      console.error("Error fetching recent activities:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for new activities
  useEffect(() => {
    fetchActivities();

    // Subscribe to changes on the activities table
    const channel = supabase.channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities'
        },
        (payload) => {
          console.log('New activity:', payload);
          fetchActivities(); // Refetch when new activity is added
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities
  };
};
