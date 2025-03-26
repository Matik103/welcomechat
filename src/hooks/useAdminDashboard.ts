
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientActivity } from '@/types/activity';

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
      const mockResponseTime = (Math.random() * 2) + 0.5;
      
      const mockQueries = [
        { name: 'Product information', value: Math.floor(Math.random() * 100) + 10 },
        { name: 'Pricing', value: Math.floor(Math.random() * 80) + 10 },
        { name: 'Support', value: Math.floor(Math.random() * 60) + 10 },
        { name: 'Feature requests', value: Math.floor(Math.random() * 40) + 10 },
        { name: 'Account issues', value: Math.floor(Math.random() * 30) + 5 },
      ];
      
      // Get actual client count from the database
      const { count: totalCount, error: countError } = await supabase
        .from('ai_agents')
        .select('*', { count: 'exact', head: true })
        .eq('interaction_type', 'config');
      
      if (countError) {
        throw countError;
      }
      
      // Get active clients (those with recent activity)
      const { data: activeClientsData, error: activeError } = await supabase
        .from('ai_agents')
        .select('id')
        .eq('interaction_type', 'config')
        .eq('status', 'active');
        
      if (activeError) {
        throw activeError;
      }
      
      const activeClientCount = activeClientsData?.length || 0;
      const previousActiveCount = activeClientCount * 0.9; // For demo, assume 10% growth
      const growthRate = ((activeClientCount - previousActiveCount) / previousActiveCount) * 100;
      
      setStatsData({
        activeUsers: mockActiveUsers,
        interactionCount: mockInteractions,
        avgResponseTime: mockResponseTime,
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
