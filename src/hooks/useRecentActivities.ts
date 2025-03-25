
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunction } from '@/utils/rpcUtils';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata: any;
  client_id: string;
  client_name?: string;
  client_email?: string;
  agent_name?: string;
  agent_description?: string;
}

export const useRecentActivities = (limit: number = 20) => {
  const fetchRecentActivities = async (): Promise<Activity[]> => {
    try {
      console.log(`Fetching recent activities (limit: ${limit})`);

      // First attempt: Try to use direct Supabase query with proper joins
      const { data: activities, error } = await supabase
        .from('client_activities')
        .select(`
          id,
          client_id,
          activity_type,
          description,
          created_at,
          metadata,
          ai_agents!client_id(name, client_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent activities:', error);
        throw error;
      }

      // Process and format the activities
      const formattedActivities = activities.map(activity => {
        // Extract client info from the joined ai_agents
        const agentInfo = Array.isArray(activity.ai_agents) 
          ? activity.ai_agents[0] 
          : activity.ai_agents;

        return {
          id: activity.id,
          activity_type: activity.activity_type,
          description: activity.description,
          created_at: activity.created_at,
          metadata: activity.metadata || {},
          client_id: activity.client_id,
          client_name: agentInfo?.client_name || 'Unknown Client',
          client_email: agentInfo?.email || '',
          agent_name: agentInfo?.name || ''
        };
      });

      console.log(`Retrieved ${formattedActivities.length} recent activities`);
      return formattedActivities;
    } catch (firstError) {
      console.error('First attempt failed, trying fallback method:', firstError);
      
      // Fallback: Use SQL via RPC function for complex join
      try {
        const sqlQuery = `
          SELECT 
            ca.id, 
            ca.client_id,
            ca.activity_type,
            ca.description,
            ca.created_at,
            ca.metadata,
            a.client_name,
            a.email as client_email,
            a.name as agent_name,
            a.agent_description
          FROM client_activities ca
          LEFT JOIN ai_agents a ON ca.client_id = a.client_id AND a.interaction_type = 'config'
          ORDER BY ca.created_at DESC
          LIMIT $1
        `;
        
        const result = await callRpcFunction('exec_sql', [sqlQuery, [limit]]);
        
        if (!result || !Array.isArray(result)) {
          console.error('Failed to fetch activities via SQL', result);
          return [];
        }
        
        console.log(`Retrieved ${result.length} recent activities via SQL`);
        return result as Activity[];
      } catch (secondError) {
        console.error('Both activity fetching methods failed:', secondError);
        return [];
      }
    }
  };

  return useQuery({
    queryKey: ['recentActivities', limit],
    queryFn: fetchRecentActivities,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000, // 1 minute
  });
};
