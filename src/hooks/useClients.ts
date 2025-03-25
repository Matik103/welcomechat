
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useClients() {
  const [totalClients, setTotalClients] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClientStats = async () => {
    setIsLoading(true);
    try {
      // Get total clients (config agents)
      const { count: totalCount, error: totalError } = await supabase
        .from('ai_agents')
        .select('id', { count: 'exact' })
        .eq('interaction_type', 'config')
        .is('deleted_at', null);

      if (totalError) throw totalError;
      setTotalClients(totalCount || 0);

      // Get active clients (had activity in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeCount, error: activeError } = await supabase
        .from('ai_agents')
        .select('id', { count: 'exact' })
        .eq('interaction_type', 'config')
        .is('deleted_at', null)
        .gte('last_active', thirtyDaysAgo.toISOString());

      if (activeError) throw activeError;
      setActiveClients(activeCount || 0);
    } catch (err) {
      console.error('Error fetching client stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch client stats'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientStats();
  }, []);

  return {
    totalClients,
    activeClients,
    isLoading,
    error,
    data: {
      totalClients,
      activeClients,
      refetch: fetchClientStats
    }
  };
}
