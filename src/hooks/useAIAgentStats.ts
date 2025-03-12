import { useState, useEffect } from 'react';
import { fetchAIAgentStats, AIAgentStats } from '@/services/statsService';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAIAgentStats(agentId: string) {
  const [stats, setStats] = useState<AIAgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!agentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await fetchAIAgentStats(agentId);
        
        if (error) {
          setError(error);
          return;
        }

        setStats(data);
      } catch (err) {
        console.error('Error in useAIAgentStats:', err);
        setError(err as PostgrestError);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('ai-agent-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agents',
          filter: `id=eq.${agentId}`
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [agentId]);

  const refreshStats = async () => {
    const { data, error } = await fetchAIAgentStats(agentId);
    if (error) {
      setError(error);
      return;
    }
    setStats(data);
  };

  return {
    stats,
    loading,
    error,
    refreshStats
  };
} 