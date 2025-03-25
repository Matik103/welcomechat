
import { useState, useEffect } from 'react';
import { ActivityLogEntry } from '@/types/activity';
import { getAllActivities } from '@/services/clientActivityService';

export function useActivities() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const data = await getAllActivities(50);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
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
    refresh: fetchActivities,
    data: { activities } // For compatibility
  };
}
