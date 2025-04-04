
import { useState, useEffect } from 'react';
import { getRecentActivities } from '@/services/activitiesService';
import { ClientActivity } from '@/types/activity';

export const useRecentActivities = (initialLimit = 10) => {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = async (limit = initialLimit) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { success, data, error: apiError } = await getRecentActivities(limit);
      
      if (!success || apiError) {
        throw new Error(apiError?.message || 'Failed to fetch activities');
      }
      
      setActivities(data || []);
      return data;
    } catch (err) {
      console.error('Error in useRecentActivities:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch on mount
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
