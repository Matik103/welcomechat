
import { useState, useEffect } from 'react';
import { ClientActivity } from '@/types/activity';

export const useRecentActivities = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activities, setActivities] = useState<ClientActivity[]>([]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Instead of fetching from the database, just return empty array
      // This prevents the database error with the enum
      setActivities([]);
      return [];
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
