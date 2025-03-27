
import { useQuery } from '@tanstack/react-query';
import { ClientActivity } from '@/types/client';

export function useRecentActivities(limit: number = 10) {
  // Simplified function that returns empty array
  const fetchRecentActivities = async (): Promise<ClientActivity[]> => {
    return [];
  };

  const {
    data: activities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['recentActivities', limit],
    queryFn: fetchRecentActivities
  });

  return {
    activities: activities || [],
    isLoading,
    error,
    refetch
  };
}
