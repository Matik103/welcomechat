
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunction } from '@/utils/rpcUtils';

interface InteractionStats {
  totalInteractions: number;
  avgInteractions: number;
  avgInteractionsChange?: number;
}

export const useInteractionStats = (timeRange: '1d' | '1m' | '1y' | 'all') => {
  return useQuery({
    queryKey: ['interactionStats', timeRange],
    queryFn: async (): Promise<InteractionStats> => {
      try {
        // Calculate time range
        const now = new Date();
        let startDate: Date;
        let prevStartDate: Date;
        let prevEndDate: Date;

        switch (timeRange) {
          case '1d':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 1);
            prevStartDate = new Date(startDate);
            prevStartDate.setDate(startDate.getDate() - 1);
            prevEndDate = new Date(startDate);
            break;
          case '1m':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            prevStartDate = new Date(startDate);
            prevStartDate.setMonth(startDate.getMonth() - 1);
            prevEndDate = new Date(startDate);
            break;
          case '1y':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            prevStartDate = new Date(startDate);
            prevStartDate.setFullYear(startDate.getFullYear() - 1);
            prevEndDate = new Date(startDate);
            break;
          case 'all':
          default:
            // Set a very old date for "all" (e.g., 5 years ago)
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 5);
            // Previous period is another 5 years before that
            prevStartDate = new Date(startDate);
            prevStartDate.setFullYear(startDate.getFullYear() - 5);
            prevEndDate = new Date(startDate);
            break;
        }

        // Use SQL for better date handling
        const interactionsSql = `
          SELECT 
            COUNT(*) as total_interactions,
            COUNT(DISTINCT client_id) as unique_clients
          FROM client_activities
          WHERE 
            created_at >= $1::timestamp
        `;
        
        const result = await callRpcFunction('exec_sql', [interactionsSql, [startDate.toISOString()]]);
        
        // Extract results
        const totalInteractions = Array.isArray(result) && result.length > 0 
          ? Number(result[0].total_interactions) || 0
          : 0;
          
        const uniqueClients = Array.isArray(result) && result.length > 0 
          ? Number(result[0].unique_clients) || 0
          : 0;
          
        // Calculate average interactions per client
        const avgInteractions = uniqueClients > 0 
          ? totalInteractions / uniqueClients 
          : 0;

        // Get previous period stats for comparison
        const prevInteractionsSql = `
          SELECT 
            COUNT(*) as total_interactions,
            COUNT(DISTINCT client_id) as unique_clients
          FROM client_activities
          WHERE 
            created_at >= $1::timestamp AND
            created_at < $2::timestamp
        `;
        
        const prevResult = await callRpcFunction(
          'exec_sql', 
          [prevInteractionsSql, [prevStartDate.toISOString(), prevEndDate.toISOString()]]
        );
        
        // Extract previous period results
        const prevUniqueClients = Array.isArray(prevResult) && prevResult.length > 0 
          ? Number(prevResult[0].unique_clients) || 0
          : 0;
          
        const prevTotalInteractions = Array.isArray(prevResult) && prevResult.length > 0 
          ? Number(prevResult[0].total_interactions) || 0
          : 0;
          
        // Calculate previous period average
        const prevAvgInteractions = prevUniqueClients > 0 
          ? prevTotalInteractions / prevUniqueClients 
          : 0;
          
        // Calculate change in average interactions
        let avgInteractionsChange: number | undefined;
        if (prevAvgInteractions > 0) {
          avgInteractionsChange = ((avgInteractions - prevAvgInteractions) / prevAvgInteractions) * 100;
        }

        return {
          totalInteractions,
          avgInteractions: parseFloat(avgInteractions.toFixed(1)),
          avgInteractionsChange: avgInteractionsChange 
            ? parseFloat(avgInteractionsChange.toFixed(1)) 
            : undefined
        };
      } catch (error) {
        console.error('Error fetching interaction stats:', error);
        // Return default values on error
        return {
          totalInteractions: 0,
          avgInteractions: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
