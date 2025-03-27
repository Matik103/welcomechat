
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientActivity } from '@/types/activity';
import { getAverageResponseTime } from '@/services/responseTimeService';

type TimeframeOption = '24h' | '7d' | '30d' | 'all';

export const useAdminDashboard = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('24h');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [statsData, setStatsData] = useState<any>({ 
    activeUsers: 0,
    interactionCount: 0,
    avgResponseTime: 0,
    commonQueries: [],
    totalClients: 0,
    activeClients: 0,
    activeClientsChange: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For demonstration, we're creating mock data
      // In a real app, you would fetch this from your API
      const mockActiveUsers = Math.floor(Math.random() * 100) + 50;
      const mockInteractions = Math.floor(Math.random() * 500) + 200;
      
      // Get actual response time from the service
      let timeRangeParam: '1d' | '1m' | '1y' | 'all' = '1d';
      
      // Map timeframe to the format expected by the responseTimeService
      if (timeframe === '24h') timeRangeParam = '1d';
      else if (timeframe === '7d') timeRangeParam = '1d'; // Since we don't have a 7d option, use 1d
      else if (timeframe === '30d') timeRangeParam = '1m';
      else timeRangeParam = 'all';
      
      const avgResponseTime = await getAverageResponseTime(timeRangeParam);
      
      const mockQueries = [
        { name: 'Product information', value: Math.floor(Math.random() * 100) + 10 },
        { name: 'Pricing', value: Math.floor(Math.random() * 80) + 10 },
        { name: 'Support', value: Math.floor(Math.random() * 60) + 10 },
        { name: 'Feature requests', value: Math.floor(Math.random() * 40) + 10 },
        { name: 'Account issues', value: Math.floor(Math.random() * 30) + 5 },
      ];
      
      // Get actual client count from the database - exclude deleted clients
      const { count: totalCount, error: countError } = await supabase
        .from('ai_agents')
        .select('*', { count: 'exact', head: true })
        .eq('interaction_type', 'config')
        .is('deleted_at', null);
      
      if (countError) {
        throw countError;
      }
      
      // Get active clients (those with recent activity in the last 48 hours)
      const timeAgo = new Date();
      timeAgo.setHours(timeAgo.getHours() - 48);
      
      const { data: activeClientsData, error: activeError } = await supabase
        .from('ai_agents')
        .select('client_id, last_active')
        .eq('interaction_type', 'config')
        .is('deleted_at', null)
        .gt('last_active', timeAgo.toISOString());
        
      if (activeError) {
        throw activeError;
      }
      
      // Count unique client IDs with recent activity
      const uniqueClientIds = new Set();
      activeClientsData?.forEach(item => {
        if (item.client_id) uniqueClientIds.add(item.client_id);
      });
      
      const activeClientCount = uniqueClientIds.size;
      const previousActiveCount = activeClientCount * 0.9; // For demo, assume 10% growth
      const growthRate = ((activeClientCount - previousActiveCount) / previousActiveCount) * 100;
      
      setStatsData({
        activeUsers: mockActiveUsers,
        interactionCount: mockInteractions,
        avgResponseTime: avgResponseTime,
        commonQueries: mockQueries,
        totalClients: totalCount || 0,
        activeClients: activeClientCount,
        activeClientsChange: growthRate
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get date based on timeframe
  const getTimeframeDate = (timeframe: TimeframeOption): string => {
    const now = new Date();
    
    switch(timeframe) {
      case '24h':
        now.setDate(now.getDate() - 1);
        break;
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case 'all':
        now.setFullYear(now.getFullYear() - 100); // Just a very old date
        break;
    }
    
    return now.toISOString();
  };
  
  useEffect(() => {
    fetchDashboardStats();
  }, [timeframe]);
  
  // Return admin dashboard data and controls
  return {
    timeframe,
    setTimeframe,
    selectedMetric,
    setSelectedMetric,
    activeUsers: statsData.activeUsers,
    interactionCount: statsData.interactionCount,
    avgResponseTime: statsData.avgResponseTime,
    commonQueries: statsData.commonQueries,
    totalClients: statsData.totalClients,
    activeClients: statsData.activeClients,
    activeClientsChange: statsData.activeClientsChange,
    isLoading,
    error,
    refetch: fetchDashboardStats
  };
};
