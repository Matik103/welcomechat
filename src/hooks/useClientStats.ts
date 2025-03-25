
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunction } from '@/utils/rpcUtils';
import { logActivity } from '@/services/clientActivityService';

interface ClientStats {
  totalClients: number;
  activeClients: number;
  recentClients: any[];
  data: any[];
}

export const useClientStats = () => {
  const { 
    data = { totalClients: 0, activeClients: 0, recentClients: [], data: [] },
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['client-stats'],
    queryFn: async (): Promise<ClientStats> => {
      try {
        // Log activity for analytics
        try {
          await logActivity('system_update', 'Admin dashboard client stats accessed');
        } catch (err) {
          console.error('Error logging activity:', err);
          // Continue execution even if logging fails
        }

        // Get count of all clients
        const { count: totalClients, error: countError } = await supabase
          .from('ai_agents')
          .select('*', { count: 'exact', head: true })
          .eq('interaction_type', 'config');

        if (countError) throw countError;

        // Get count of active clients (had interactions in past 30 days)
        const activeClientsQuery = `
          SELECT COUNT(DISTINCT client_id) as count
          FROM client_activities
          WHERE created_at > NOW() - INTERVAL '30 days'
          AND activity_type = 'chat_interaction'
        `;

        const { data: activeData, error: activeError } = await callRpcFunction('exec_sql', { 
          sql_query: activeClientsQuery 
        });

        if (activeError) throw activeError;

        const activeClients = activeData && activeData[0] ? activeData[0].count : 0;

        // Get most recent clients
        const { data: recentClients, error: recentError } = await supabase
          .from('ai_agents')
          .select('id, client_name, created_at')
          .eq('interaction_type', 'config')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;

        // Return the combined data
        return {
          totalClients: totalClients || 0,
          activeClients: activeClients || 0,
          recentClients: recentClients || [],
          data: [] // Placeholder for future data
        };
      } catch (error) {
        console.error('Error fetching client stats:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    ...data,
    isLoading,
    error,
    refetch
  };
};
