
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
  const [activeClientsChange, setActiveClientsChange] = useState<string | undefined>(undefined);
  const [avgInteractions, setAvgInteractions] = useState(0);
  const [avgInteractionsChange, setAvgInteractionsChange] = useState<string | undefined>(undefined);
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

      // Mock data for now - would connect to actual stats in real implementation
      setTotalClients(30);
      setActiveClients(18);
      setActiveClientsChange("5");
      setAvgInteractions(120);
      setAvgInteractionsChange("12");
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
    activeClientsChange,
    avgInteractions,
    avgInteractionsChange,
    isLoading,
    error,
    refetch
  };
};
