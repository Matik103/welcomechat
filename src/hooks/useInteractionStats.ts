
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { execSql } from '@/utils/rpcUtils';
import { createActivityDirect } from '@/services/clientActivityService';

// Interface for daily interaction counts
interface DailyInteraction {
  day: string;
  count: number;
}

// Interface for client with interaction count
interface TopClient {
  client_id: string;
  client_name: string;
  interaction_count: number;
}

export const useInteractionStats = (days: number = 30) => {
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [dailyInteractions, setDailyInteractions] = useState<DailyInteraction[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Log activity
        try {
          await createActivityDirect(
            'system',
            'stats_accessed' as any,
            'Admin dashboard interaction stats accessed',
            { days: days }
          );
        } catch (logError) {
          console.error('Error logging stats access:', logError);
          // Non-critical error, don't throw
        }

        // Get total interactions
        const totalSql = `
          SELECT COUNT(*) as count
          FROM client_activities
          WHERE activity_type = 'chat_interaction'
          AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
        `;
        
        const totalResult = await execSql(totalSql);
        const total = totalResult?.[0]?.count || 0;
        setTotalInteractions(Number(total));
        
        // Get daily interactions
        const dailySql = `
          SELECT 
            date_trunc('day', created_at) AS day,
            COUNT(*) AS count
          FROM client_activities
          WHERE 
            activity_type = 'chat_interaction'
            AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY date_trunc('day', created_at)
          ORDER BY day
        `;
        
        const dailyResult = await execSql(dailySql);
        
        if (Array.isArray(dailyResult)) {
          setDailyInteractions(dailyResult.map(row => ({
            day: row.day,
            count: Number(row.count)
          })));
        }
        
        // Get top clients by interaction count
        const topClientsSql = `
          SELECT 
            a.client_id,
            c.client_name AS client_name,
            COUNT(*) AS interaction_count
          FROM client_activities a
          LEFT JOIN ai_agents c ON a.client_id = c.id
          WHERE 
            a.activity_type = 'chat_interaction'
            AND a.created_at >= CURRENT_DATE - INTERVAL '${days} days'
            AND c.interaction_type = 'config'
          GROUP BY a.client_id, c.client_name
          ORDER BY interaction_count DESC
          LIMIT 5
        `;
        
        const topClientsResult = await execSql(topClientsSql);
        
        if (Array.isArray(topClientsResult)) {
          setTopClients(topClientsResult.map(row => ({
            client_id: row.client_id,
            client_name: row.client_name || 'Unknown Client',
            interaction_count: Number(row.interaction_count)
          })));
        }
      } catch (err) {
        console.error('Error fetching interaction stats:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch interaction stats'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [days]);
  
  return { totalInteractions, dailyInteractions, topClients, isLoading, error };
};
