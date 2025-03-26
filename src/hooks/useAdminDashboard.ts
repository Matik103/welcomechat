
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { execSql } from '@/utils/rpcUtils';

export const useAdminDashboard = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      // Fetch active users count
      const activeUsersQuery = await execSql(`
        SELECT COUNT(DISTINCT client_id) as active_users 
        FROM client_activities 
        WHERE created_at > NOW() - INTERVAL '7 days'
      `);
      const activeUsers = activeUsersQuery?.[0]?.active_users || 0;
      
      // Fetch interaction count
      const interactionQuery = await execSql(`
        SELECT COUNT(*) as count 
        FROM client_activities 
        WHERE activity_type = 'chat_interaction'
        AND created_at > NOW() - INTERVAL '30 days'
      `);
      const interactionCount = interactionQuery?.[0]?.count || 0;
      
      // Fetch average response time
      const responseTimeQuery = await execSql(`
        SELECT AVG(CAST(metadata->>'response_time_ms' AS INTEGER)) as avg_time
        FROM client_activities
        WHERE activity_type = 'chat_interaction'
        AND created_at > NOW() - INTERVAL '30 days'
        AND metadata->>'response_time_ms' IS NOT NULL
      `);
      const avgResponseTime = responseTimeQuery?.[0]?.avg_time || 0;
      
      // Fetch common queries
      const commonQueriesQuery = await execSql(`
        SELECT metadata->>'query' as query, COUNT(*) as count
        FROM client_activities
        WHERE activity_type = 'chat_interaction'
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY metadata->>'query'
        ORDER BY count DESC
        LIMIT 5
      `);
      const commonQueries = commonQueriesQuery?.map(item => ({
        query: item.query,
        count: item.count
      })) || [];
      
      // Count total clients
      const totalClientsQuery = await execSql(`
        SELECT COUNT(DISTINCT client_id) as total_clients
        FROM ai_agents
        WHERE interaction_type = 'config'
      `);
      const totalClients = totalClientsQuery?.[0]?.total_clients || 0;
      
      // Count active clients in the last 30 days
      const activeClientsQuery = await execSql(`
        SELECT COUNT(DISTINCT client_id) as active_clients
        FROM client_activities
        WHERE created_at > NOW() - INTERVAL '30 days'
      `);
      const activeClients = activeClientsQuery?.[0]?.active_clients || 0;
      
      // Calculate change in active clients from previous 30 days
      const previousActiveClientsQuery = await execSql(`
        SELECT COUNT(DISTINCT client_id) as prev_active_clients
        FROM client_activities
        WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
      `);
      const previousActiveClients = previousActiveClientsQuery?.[0]?.prev_active_clients || 0;
      const activeClientsChange = previousActiveClients > 0 
        ? ((activeClients - previousActiveClients) / previousActiveClients) * 100
        : 100;
      
      return {
        activeUsers,
        interactionCount,
        avgResponseTime,
        commonQueries,
        totalClients,
        activeClients,
        activeClientsChange
      };
    }
  });
  
  return {
    activeUsers: data?.activeUsers || 0,
    interactionCount: data?.interactionCount || 0,
    avgResponseTime: data?.avgResponseTime || 0,
    commonQueries: data?.commonQueries || [],
    totalClients: data?.totalClients || 0,
    activeClients: data?.activeClients || 0,
    activeClientsChange: data?.activeClientsChange || 0,
    isLoading,
    error,
    refetch
  };
};
