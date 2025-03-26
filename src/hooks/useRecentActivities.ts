
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientActivity, ActivityType } from '@/types/client';

export function useRecentActivities(limit: number = 10) {
  const queryClient = useQueryClient();

  const fetchRecentActivities = async (): Promise<ClientActivity[]> => {
    try {
      console.log('Fetching recent activities, limit:', limit);
      
      const { data, error } = await supabase
        .from('client_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }
      
      // Map the data to ensure metadata is correctly typed
      const activities: ClientActivity[] = data.map(activity => ({
        id: activity.id,
        client_id: activity.client_id || undefined,
        activity_type: activity.activity_type as ActivityType,
        description: activity.description || '',
        created_at: activity.created_at,
        // Convert metadata to Record<string, any>
        metadata: activity.metadata ? 
          (typeof activity.metadata === 'object' ? activity.metadata as Record<string, any> : {}) 
          : undefined
      }));
      
      console.log('Recent activities fetched:', activities.length);
      
      return activities;
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      throw error;
    }
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
