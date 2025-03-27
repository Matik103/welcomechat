
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClientActivity } from '@/types/client';

// This is a temporary placeholder since client_activities table has been removed
export function useRecentActivities(limit: number = 10) {
  // Mock function that returns empty array since table doesn't exist
  const fetchRecentActivities = async (): Promise<ClientActivity[]> => {
    console.log('Activity logging is disabled - client_activities table has been removed');
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
