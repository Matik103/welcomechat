
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getClientCount } from '@/services/statsService';
import { getActiveClients } from '@/services/activeDaysService';
import { getResponseTimeStats } from '@/services/responseTimeService';
import { getInteractionCount } from '@/services/interactionCountService';
import { getTopQueries } from '@/services/topQueriesService';

export function useAdminDashboard() {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<string>('interactions');
  
  // Query to get client count
  const clientCountQuery = useQuery({
    queryKey: ['clientCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ai_agents')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      
      if (error) throw error;
      return count || 0;
    }
  });
  
  // Query to get active clients
  const activeClientsQuery = useQuery({
    queryKey: ['activeClients', timeframe],
    queryFn: () => getActiveClients(timeframe)
  });
  
  // Query to get response time stats
  const responseTimeQuery = useQuery({
    queryKey: ['responseTime', timeframe],
    queryFn: () => getResponseTimeStats(timeframe)
  });
  
  // Query to get interaction count
  const interactionCountQuery = useQuery({
    queryKey: ['interactionCount', timeframe],
    queryFn: () => getInteractionCount(timeframe)
  });
  
  // Query to get top queries
  const topQueriesQuery = useQuery({
    queryKey: ['topQueries', timeframe],
    queryFn: () => getTopQueries(timeframe)
  });
  
  // Query to get unique visitors
  const uniqueVisitorsQuery = useQuery({
    queryKey: ['uniqueVisitors', timeframe],
    queryFn: async () => {
      // This is a placeholder for the actual query
      // In a real scenario, you would get this data from your database
      return {
        current: 120,
        previous: 105,
        data: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 50) + 75
        }))
      };
    }
  });
  
  // Query to get recent activities
  const recentActivitiesQuery = useQuery({
    queryKey: ['recentActivities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });
  
  // Query to get client list for user dropdown
  const clientsForDropdownQuery = useQuery({
    queryKey: ['clientsDropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id, client_id, client_name, name')
        .is('deleted_at', null)
        .order('client_name', { ascending: true });
      
      if (error) throw error;
      
      // Format the data for the dropdown
      return data.map(client => ({
        value: client.id,
        label: client.client_name || client.name || 'Unnamed Client'
      }));
    }
  });
  
  // Calculate total clients
  const totalClients = clientCountQuery.data || 0;
  
  // Format data for the metrics cards
  const metricsData = [
    {
      title: 'Total Clients',
      value: totalClients.toString(),
      change: '+5%',
      trend: 'up',
      loading: clientCountQuery.isLoading
    },
    {
      title: 'Active Clients',
      value: activeClientsQuery.data?.current.toString() || '0',
      change: activeClientsQuery.data 
        ? `${((activeClientsQuery.data.current - activeClientsQuery.data.previous) / activeClientsQuery.data.previous * 100).toFixed(1)}%` 
        : '0%',
      trend: activeClientsQuery.data?.current > activeClientsQuery.data?.previous ? 'up' : 'down',
      loading: activeClientsQuery.isLoading
    },
    {
      title: 'Avg. Response Time',
      value: responseTimeQuery.data?.current.toFixed(2) + 's' || '0s',
      change: responseTimeQuery.data 
        ? `${((responseTimeQuery.data.current - responseTimeQuery.data.previous) / responseTimeQuery.data.previous * 100).toFixed(1)}%` 
        : '0%',
      trend: responseTimeQuery.data?.current < responseTimeQuery.data?.previous ? 'up' : 'down',
      loading: responseTimeQuery.isLoading
    },
    {
      title: 'Total Interactions',
      value: interactionCountQuery.data?.current.toString() || '0',
      change: interactionCountQuery.data 
        ? `${((interactionCountQuery.data.current - interactionCountQuery.data.previous) / interactionCountQuery.data.previous * 100).toFixed(1)}%` 
        : '0%',
      trend: interactionCountQuery.data?.current > interactionCountQuery.data?.previous ? 'up' : 'down',
      loading: interactionCountQuery.isLoading
    }
  ];
  
  // Get chart data based on selected metric
  const getChartData = () => {
    switch (selectedMetric) {
      case 'interactions':
        return interactionCountQuery.data?.data || [];
      case 'responseTime':
        return responseTimeQuery.data?.data || [];
      case 'activeClients':
        return activeClientsQuery.data?.data || [];
      case 'uniqueVisitors':
        return uniqueVisitorsQuery.data?.data || [];
      default:
        return [];
    }
  };
  
  // Format the chart data for Recharts
  const chartData = getChartData().map(item => ({
    name: item.date,
    value: item.value
  }));
  
  return {
    timeframe,
    setTimeframe,
    selectedMetric,
    setSelectedMetric,
    metricsData,
    chartData,
    topQueries: topQueriesQuery.data || [],
    recentActivities: recentActivitiesQuery.data || [],
    clientsForDropdown: clientsForDropdownQuery.data || [],
    isLoadingChartData: 
      interactionCountQuery.isLoading || 
      responseTimeQuery.isLoading || 
      activeClientsQuery.isLoading ||
      uniqueVisitorsQuery.isLoading,
    isLoadingTopQueries: topQueriesQuery.isLoading,
    isLoadingRecentActivities: recentActivitiesQuery.isLoading,
    refetch: () => {
      clientCountQuery.refetch();
      activeClientsQuery.refetch();
      responseTimeQuery.refetch();
      interactionCountQuery.refetch();
      topQueriesQuery.refetch();
      uniqueVisitorsQuery.refetch();
      recentActivitiesQuery.refetch();
      clientsForDropdownQuery.refetch();
    }
  };
}
