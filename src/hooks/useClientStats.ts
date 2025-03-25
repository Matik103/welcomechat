
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunction } from '@/utils/rpcUtils';

interface ClientStats {
  totalClients: number;
  activeClients: number;
  activeClientsChange?: number;
  newClientsThisMonth: number;
  newClientsLastMonth: number;
}

export const useClientStats = () => {
  return useQuery({
    queryKey: ['clientStats'],
    queryFn: async (): Promise<ClientStats> => {
      try {
        // Get total number of clients
        const { count: totalClients, error: countError } = await supabase
          .from('ai_agents')
          .select('*', { count: 'exact', head: true })
          .eq('interaction_type', 'config')
          .neq('status', 'deleted');

        if (countError) throw countError;

        // Get active clients (those with activity in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Try SQL method for better accuracy with date filtering
        const activeSql = `
          SELECT COUNT(DISTINCT client_id) as count
          FROM client_activities
          WHERE created_at >= $1::timestamp
        `;
        
        const activeResult = await callRpcFunction('exec_sql', [activeSql, [thirtyDaysAgo.toISOString()]]);
        const activeClients = Array.isArray(activeResult) && activeResult.length > 0 
          ? Number(activeResult[0].count) || 0
          : 0;

        // Get active clients in the previous 30 days for comparison
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const prevActiveSql = `
          SELECT COUNT(DISTINCT client_id) as count
          FROM client_activities
          WHERE created_at >= $1::timestamp AND created_at < $2::timestamp
        `;
        
        const prevActiveResult = await callRpcFunction(
          'exec_sql', 
          [prevActiveSql, [sixtyDaysAgo.toISOString(), thirtyDaysAgo.toISOString()]]
        );
        const prevActiveClients = Array.isArray(prevActiveResult) && prevActiveResult.length > 0 
          ? Number(prevActiveResult[0].count) || 0
          : 0;

        // Calculate change percentage in active clients
        let activeClientsChange: number | undefined;
        if (prevActiveClients > 0) {
          activeClientsChange = ((activeClients - prevActiveClients) / prevActiveClients) * 100;
        }

        // Count new clients this month
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        const { count: newClientsThisMonth, error: newError } = await supabase
          .from('ai_agents')
          .select('*', { count: 'exact', head: true })
          .eq('interaction_type', 'config')
          .gte('created_at', firstDayOfMonth.toISOString());

        if (newError) throw newError;

        // Count new clients last month
        const firstDayOfLastMonth = new Date();
        firstDayOfLastMonth.setMonth(firstDayOfLastMonth.getMonth() - 1);
        firstDayOfLastMonth.setDate(1);
        firstDayOfLastMonth.setHours(0, 0, 0, 0);
        
        const lastDayOfLastMonth = new Date();
        lastDayOfLastMonth.setDate(0); // Last day of previous month
        lastDayOfLastMonth.setHours(23, 59, 59, 999);

        const { count: newClientsLastMonth, error: lastMonthError } = await supabase
          .from('ai_agents')
          .select('*', { count: 'exact', head: true })
          .eq('interaction_type', 'config')
          .gte('created_at', firstDayOfLastMonth.toISOString())
          .lte('created_at', lastDayOfLastMonth.toISOString());

        if (lastMonthError) throw lastMonthError;

        return {
          totalClients: totalClients || 0,
          activeClients,
          activeClientsChange,
          newClientsThisMonth: newClientsThisMonth || 0,
          newClientsLastMonth: newClientsLastMonth || 0
        };
      } catch (error) {
        console.error('Error fetching client stats:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
