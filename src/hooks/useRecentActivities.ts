
import { useState, useEffect } from 'react';
import { ClientActivity } from '@/types/activity';
import { getRecentActivities } from '@/services/activitiesService';

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
      
      // If successful but empty, just set empty array
      setActivities(data || []);
      return data || [];
    } catch (err) {
      console.error("Error fetching recent activities:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities
  };
};
