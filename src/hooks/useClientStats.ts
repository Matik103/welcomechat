
import { useState, useEffect } from 'react';
import { getActiveDays } from '@/services/activeDaysService';
import { getInteractionCount } from '@/services/interactionCountService'; 
import { getAverageResponseTime } from '@/services/responseTimeService';
import { createClientActivity } from '@/services/clientActivityService';

interface ClientStats {
  totalInteractions: number;
  activeDays: number;
  averageResponseTime: number;
}

export const useClientStats = (clientId?: string, agentName?: string) => {
  const [totalClients, setTotalClients] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<ClientStats>({
    totalInteractions: 0,
    activeDays: 0,
    averageResponseTime: 0
  });

  const fetchStats = async () => {
    if (!clientId) return;
    
    try {
      setIsLoading(true);
      
      // Log the stat fetching activity
      await createClientActivity(
        clientId,
        "client_updated",
        "Fetched client statistics",
        { agent_name: agentName || '' }
      );
      
      // Fetch all stats in parallel
      const [interactions, days, avgTime] = await Promise.all([
        getInteractionCount(clientId, agentName),
        getActiveDays(clientId, agentName),
        getAverageResponseTime(clientId, agentName)
      ]);
      
      setStats({
        totalInteractions: interactions,
        activeDays: days,
        averageResponseTime: avgTime
      });
    } catch (err) {
      console.error('Error fetching client stats:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [clientId, agentName]);

  const refetch = () => {
    fetchStats();
  };

  return {
    ...stats,
    totalClients,
    activeClients,
    isLoading,
    error,
    refetch
  };
};
