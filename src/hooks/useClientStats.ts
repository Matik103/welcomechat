
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createActivityDirect } from '@/services/clientActivityService';

export const useClientStats = () => {
  const [totalClients, setTotalClients] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total clients
        const { count: totalCount, error: totalError } = await supabase
          .from('ai_agents')
          .select('id', { count: 'exact', head: true })
          .eq('interaction_type', 'config');
        
        if (totalError) throw totalError;
        
        // Get active clients (active in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { count: activeCount, error: activeError } = await supabase
          .from('ai_agents')
          .select('id', { count: 'exact', head: true })
          .eq('interaction_type', 'config')
          .gt('last_active', thirtyDaysAgo.toISOString());
        
        if (activeError) throw activeError;
        
        // Log activity for stats access
        try {
          await createActivityDirect(
            'system',
            'stats_accessed' as any,
            'Admin dashboard client stats accessed',
            { total_clients: totalCount || 0, active_clients: activeCount || 0 }
          );
        } catch (logError) {
          console.error('Error logging stats access:', logError);
          // Non-critical error, don't throw
        }
        
        // Update state
        setTotalClients(totalCount || 0);
        setActiveClients(activeCount || 0);
      } catch (err) {
        console.error('Error fetching client stats:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch client stats'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  return { 
    totalClients, 
    activeClients, 
    isLoading, 
    error,
    // Add data property for compatibility
    data: { totalClients, activeClients }
  };
};
