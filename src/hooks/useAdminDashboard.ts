
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunctionSafe } from '@/utils/rpcUtils';

// Dashboard stats interface
interface DashboardStats {
  activeUsers: number;
  interactionCount: number;
  avgResponseTime: number;
  commonQueries: { query: string; count: number }[];
  totalClients: number;
  activeClients: number;
  activeClientsChange: number;
}

export function useAdminDashboard() {
  const fetchDashboardStats = async (): Promise<DashboardStats> => {
    // Function to safely parse JSON fields
    const safeGetJsonValue = <T>(jsonObj: any, path: string, defaultValue: T): T => {
      if (!jsonObj) return defaultValue;
      try {
        // For string JSON
        if (typeof jsonObj === 'string') {
          try {
            jsonObj = JSON.parse(jsonObj);
          } catch (e) {
            return defaultValue;
          }
        }
        
        // Handle nested paths like 'stats.count'
        const parts = path.split('.');
        let current = jsonObj;
        
        for (const part of parts) {
          if (current === null || current === undefined || typeof current !== 'object') {
            return defaultValue;
          }
          current = current[part];
        }
        
        return current !== undefined && current !== null ? current : defaultValue;
      } catch (e) {
        console.error(`Error getting JSON value for path ${path}:`, e);
        return defaultValue;
      }
    };

    try {
      // Fetch active users - past 7 days
      const activeUsersData = await callRpcFunctionSafe<any>(
        'get_active_users_count',
        { days_ago: 7 }
      );
      
      const activeUsers = safeGetJsonValue<number>(activeUsersData, 'active_users', 0);
      
      // Fetch interaction count - past 30 days
      const interactionCountData = await callRpcFunctionSafe<any>(
        'get_interaction_count',
        { days_ago: 30 }
      );
      
      const interactionCount = safeGetJsonValue<number>(interactionCountData, 'count', 0);
      
      // Fetch average response time
      const avgResponseTimeData = await callRpcFunctionSafe<any>(
        'get_avg_response_time',
        { days_ago: 30 }
      );
      
      const avgResponseTime = safeGetJsonValue<number>(avgResponseTimeData, 'avg_time', 0);
      
      // Fetch common queries
      const commonQueriesData = await callRpcFunctionSafe<any[]>(
        'get_common_queries',
        { 
          limit_param: 5,
          client_id_param: '',
          agent_name_param: ''
        }
      );
      
      const commonQueries = Array.isArray(commonQueriesData) 
        ? commonQueriesData.map(item => ({
            query: safeGetJsonValue<string>(item, 'query', ''),
            count: safeGetJsonValue<number>(item, 'count', 0)
          }))
        : [];
      
      // Fetch total clients from ai_agents table
      const { count: totalClientsCount, error: totalClientsError } = await supabase
        .from('ai_agents')
        .select('client_id', { count: 'exact', head: true })
        .eq('interaction_type', 'config');

      // Safe handling of count
      const totalClients = totalClientsCount || 0;
      
      // Fetch active clients - past 7 days
      const activeClientsData = await callRpcFunctionSafe<any>(
        'get_active_clients_count',
        { days_ago: 7 }
      );
      
      const activeClients = safeGetJsonValue<number>(activeClientsData, 'active_clients', 0);
      
      // Fetch active clients - previous 7 days for comparison
      const prevActiveClientsData = await callRpcFunctionSafe<any>(
        'get_active_clients_count_previous_period',
        { days_ago: 7 }
      );
      
      const prevActiveClients = safeGetJsonValue<number>(prevActiveClientsData, 'prev_active_clients', 0);
      
      // Calculate change in active clients
      const activeClientsChange = prevActiveClients > 0 
        ? ((activeClients - prevActiveClients) / prevActiveClients) * 100
        : 0;
      
      return {
        activeUsers,
        interactionCount,
        avgResponseTime,
        commonQueries,
        totalClients,
        activeClients,
        activeClientsChange
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: fetchDashboardStats,
  });

  const stats: DashboardStats = data || {
    activeUsers: 0,
    interactionCount: 0,
    avgResponseTime: 0,
    commonQueries: [],
    totalClients: 0,
    activeClients: 0,
    activeClientsChange: 0
  };

  return {
    ...stats,
    refetch: async () => {
      await refetch();
    },
    isLoading,
    error
  };
}
