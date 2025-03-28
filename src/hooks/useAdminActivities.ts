
import { useState } from 'react';
import { ClientActivity } from '@/types/activity';
import { getRecentActivities } from '@/services/activitiesService';

export const useAdminActivities = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activities, setActivities] = useState<ClientActivity[]>([]);

  const fetchActivities = async (limit = 20) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get activities from the service
      const { success, data, error: serviceError } = await getRecentActivities(limit);
      
      if (!success || serviceError) {
        throw new Error(serviceError?.message || 'Failed to fetch activities');
      }
      
      // Use the returned data or empty array as fallback
      const activitiesData = data || [];
      setActivities(activitiesData);
      return activitiesData;
    } catch (err) {
      console.error("Error fetching admin activities:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activities,
    isLoading,
    error,
    fetchActivities
  };
};
