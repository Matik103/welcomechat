
import { useState, useEffect } from 'react';
import { callRpcFunction } from '@/utils/rpcUtils';

interface DailyInteraction {
  date: string;
  count: number;
}

interface TopClient {
  client_id: string;
  client_name: string;
  count: number;
}

export function useInteractions() {
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [dailyInteractions, setDailyInteractions] = useState<DailyInteraction[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInteractions = async () => {
    setIsLoading(true);
    try {
      // Get total interactions
      const totalData = await callRpcFunction('get_total_interactions', {});
      setTotalInteractions(totalData?.count || 0);

      // Get daily interactions
      const dailyData = await callRpcFunction('get_daily_interactions', {
        days_param: 14
      });
      setDailyInteractions(Array.isArray(dailyData) ? dailyData : []);

      // Get top clients
      const topClientsData = await callRpcFunction('get_top_clients_by_interactions', {
        limit_param: 5
      });
      setTopClients(Array.isArray(topClientsData) ? topClientsData : []);
    } catch (err) {
      console.error('Error fetching interactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch interactions'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  return {
    totalInteractions,
    dailyInteractions,
    topClients,
    isLoading,
    error
  };
}
