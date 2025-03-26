
import { useState, useEffect } from 'react';
import { getClientStats } from '@/services/statsService';
import { TimeRange } from '@/types/client-dashboard';

export interface ClientStats {
  activeUsers: number;
  interactionCount: number;
  avgResponseTime: number;
  commonQueries: { query: string; count: number }[];
  isLoading: boolean;
  error: Error | null;
}

export const useClientStats = (clientId?: string, timeRange: TimeRange = '1m') => {
  const [stats, setStats] = useState<ClientStats>({
    activeUsers: 0,
    interactionCount: 0,
    avgResponseTime: 0,
    commonQueries: [],
    isLoading: true,
    error: null
  });

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Convert timeRange to the correct type
      const range = timeRange as "1d" | "1m" | "1y" | "all";
      const data = await getClientStats(clientId, range);
      
      setStats({
        activeUsers: data.activeDays,
        interactionCount: data.interactionCount,
        avgResponseTime: data.avgResponseTime,
        commonQueries: data.commonQueries.map(q => ({
          query: q.query,
          count: q.count
        })),
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching client stats:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch stats')
      }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [clientId, timeRange]);

  const refetch = async () => {
    await fetchStats();
  };

  return {
    ...stats,
    refetch
  };
};
