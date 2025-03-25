
import { useState, useEffect } from 'react';
import { callRpcFunction } from '@/utils/rpcUtils';

// Update to use any expected structure
interface InteractionData {
  count: number;
  client_id?: string;
  client_name?: string;
  date?: string;
  // add any other fields you expect
}

export function useInteractionStats(clientId?: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [dailyInteractions, setDailyInteractions] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Get total interaction count
      const total = await callRpcFunction('get_total_interactions', {
        client_id_param: clientId || null
      });
      
      setTotalInteractions(total?.count || 0);

      // Get daily interactions
      const dailyData = await callRpcFunction('get_daily_interactions', {
        client_id_param: clientId || null,
        days_param: 14
      });
      
      setDailyInteractions(Array.isArray(dailyData) ? dailyData : []);

      // Only fetch top clients if no specific client is provided
      if (!clientId) {
        const topClientsData = await callRpcFunction('get_top_clients_by_interactions', {
          limit_param: 5
        });
        
        setTopClients(Array.isArray(topClientsData) ? topClientsData : []);
      }
    } catch (err) {
      console.error('Error fetching interaction stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch interaction stats'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [clientId]);

  return {
    totalInteractions,
    dailyInteractions,
    topClients,
    isLoading,
    error,
    refresh: fetchStats
  };
}
