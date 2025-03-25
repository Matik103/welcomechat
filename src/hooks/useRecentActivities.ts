
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLogEntry, ActivityType, ActivityTypeMap } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';

interface UseRecentActivitiesProps {
  clientId?: string;
  limit?: number;
  refreshInterval?: number | null;
}

export const useRecentActivities = ({ 
  clientId,
  limit = 10,
  refreshInterval = null 
}: UseRecentActivitiesProps = {}) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to normalize activity data
  const normalizeActivity = (activity: any): ActivityLogEntry => {
    // Handle client name safely
    const clientName = activity.ai_agents && 
                     typeof activity.ai_agents === 'object' && 
                     'client_name' in activity.ai_agents ? 
                     activity.ai_agents.client_name || '' : 
                     activity.client_name || '';
    
    // Handle the metadata correctly depending on its type
    let description = '';
    let metadata = {};
    
    if (activity.description && typeof activity.description === 'string') {
      description = activity.description;
    }
    
    if (activity.metadata) {
      if (typeof activity.metadata === 'object') {
        metadata = activity.metadata;
      }
    }
    
    // Determine activity type with fallback
    let activityType: ActivityType;
    if (activity.activity_type && typeof activity.activity_type === 'string') {
      activityType = ActivityTypeMap[activity.activity_type] || activity.activity_type as ActivityType;
    } else {
      activityType = 'client_updated'; // Default fallback
    }
    
    return {
      id: activity.id.toString(),
      type: activityType,
      description: description,
      timestamp: activity.created_at,
      clientId: activity.client_id,
      clientName: clientName,
      metadata: metadata
    };
  };

  // Function to fetch recent activities
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('client_activities')
        .select(`*`);
      
      // Filter by client_id if provided
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      // Apply order and limit
      query = query.order('created_at', { ascending: false }).limit(limit);
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Process and normalize the data
      const normalizedActivities = (data || []).map(activity => {
        return normalizeActivity(activity);
      });
      
      setActivities(normalizedActivities);
      setError(null);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch on mount
  useEffect(() => {
    fetchActivities();
    
    // Set up interval for refreshing data if needed
    let intervalId: number | undefined;
    if (refreshInterval) {
      intervalId = window.setInterval(fetchActivities, refreshInterval);
    }
    
    // Clean up interval on unmount
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [clientId, limit, refreshInterval]);
  
  return { 
    activities, 
    isLoading, 
    error,
    refresh: fetchActivities,
    // Add data property for compatibility with older code
    data: { activities }
  };
};
