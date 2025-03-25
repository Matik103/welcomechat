
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToAllActivities, subscribeToClientActivities } from '@/services/activitySubscriptionService';
import { ClientActivity } from '@/types/client-dashboard';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useRecentActivities = (clientId?: string, limit: number = 10) => {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('client_activities')
        .select(`
          id,
          client_id,
          activity_type,
          description,
          created_at,
          metadata
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // Add client filter if specific client
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (data) {
        // For each activity, fetch the client name if it's an admin view (no clientId provided)
        if (!clientId) {
          const activitiesWithClientNames = await Promise.all(
            data.map(async (activity) => {
              if (activity.client_id) {
                // Fetch client name from ai_agents table
                const { data: clientData } = await supabase
                  .from('ai_agents')
                  .select('client_name')
                  .eq('client_id', activity.client_id)
                  .eq('interaction_type', 'config')
                  .single();
                
                return {
                  ...activity,
                  client_name: clientData?.client_name || 'Unknown Client'
                };
              }
              
              return {
                ...activity,
                client_name: 'System'
              };
            })
          );
          
          setActivities(activitiesWithClientNames as ClientActivity[]);
        } else {
          setActivities(data as ClientActivity[]);
        }
      }
    } catch (err) {
      console.error('Error fetching recent activities:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [clientId, limit]);

  useEffect(() => {
    fetchActivities();
    
    // Set up realtime subscription
    let channel: RealtimeChannel;
    
    if (clientId) {
      channel = subscribeToClientActivities(clientId, fetchActivities);
    } else {
      channel = subscribeToAllActivities(fetchActivities);
    }
    
    return () => {
      // Clean up subscription on unmount
      channel.unsubscribe();
    };
  }, [clientId, fetchActivities]);

  return { activities, isLoading, error, refetch: fetchActivities };
};
