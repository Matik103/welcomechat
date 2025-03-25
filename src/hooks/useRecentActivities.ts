
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityWithClientInfo } from '@/types/activity';

/**
 * Hook to get recent activities across all clients for the admin dashboard
 */
export const useRecentActivities = (limit: number = 20) => {
  return useQuery({
    queryKey: ['recentActivities', limit],
    queryFn: async (): Promise<ActivityWithClientInfo[]> => {
      try {
        // Get recent activities with client information
        const { data: activities, error } = await supabase
          .from('client_activities')
          .select(`
            *,
            ai_agents!client_activities_client_id_fkey(
              name, 
              settings
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (error) {
          console.error("Error fetching recent activities:", error);
          throw error;
        }
        
        // Transform data to include client info
        const activitiesWithClientInfo: ActivityWithClientInfo[] = activities.map(activity => {
          const clientAgent = activity.ai_agents ? activity.ai_agents[0] : null;
          const settings = clientAgent?.settings || {};
          
          return {
            id: activity.id,
            client_id: activity.client_id || '',
            activity_type: activity.activity_type,
            description: activity.description || '',
            metadata: activity.metadata || {},
            created_at: activity.created_at,
            updated_at: activity.updated_at,
            // Extract client name from related ai_agents record
            client_name: settings.client_name || clientAgent?.name || 'Unknown Client',
            // Add other useful fields from the metadata if available
            agent_name: settings.agent_name || clientAgent?.name
          };
        });
        
        return activitiesWithClientInfo;
      } catch (error) {
        console.error("Error in useRecentActivities hook:", error);
        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
};
