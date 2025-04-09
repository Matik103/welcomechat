
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const useClientViewData = (clientId?: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInteractions: 0,
    activeUsers: 0,
    avgResponseTime: 0,
  });
  const [queries, setQueries] = useState<Array<{
    query_text: string;
    frequency: number;
    id: string;
    last_asked: string;
  }>>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      setError('Client ID is required');
      return;
    }

    const fetchClientData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch interaction stats
        const { data: statsData, error: statsError } = await supabase
          .from('ai_interactions')
          .select('*')
          .eq('client_id', clientId);

        if (statsError) throw statsError;

        // Calculate stats
        const totalInteractions = statsData?.length || 0;
        const avgResponseTime = statsData && statsData.length > 0
          ? statsData.reduce((sum, item) => sum + (item.response_time_ms || 0), 0) / statsData.length / 1000
          : 0;

        // Set stats data
        setStats({
          totalInteractions,
          activeUsers: 0, // This would need additional backend logic
          avgResponseTime,
        });

        // Fetch and process top queries with frequency
        const { data: queriesData, error: queriesError } = await supabase.rpc('get_common_queries', {
          client_id_param: clientId,
          limit_param: 10
        });

        if (queriesError) throw queriesError;

        const formattedQueries = queriesData?.map(item => ({
          query_text: item.query_text,
          frequency: item.frequency,
          id: item.id,
          last_asked: item.last_asked ? format(new Date(item.last_asked), 'MMM d, yyyy') : 'Unknown'
        })) || [];

        setQueries(formattedQueries);

        // Fetch recent interactions
        const { data: interactionsData, error: interactionsError } = await supabase
          .from('ai_interactions')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (interactionsError) throw interactionsError;

        setInteractions(interactionsData || []);

        // Fetch error logs
        const { data: errorData, error: errorError } = await supabase
          .from('error_logs')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (errorError) throw errorError;

        setErrorLogs(errorData || []);
      } catch (error) {
        console.error('Error fetching client data:', error);
        setError(`Failed to load client data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        toast.error('Failed to load client data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  return {
    isLoading,
    error,
    stats,
    queries,
    interactions,
    errorLogs,
  };
};
