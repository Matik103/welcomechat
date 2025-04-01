
import { supabase } from '@/integrations/supabase/client';
import { QueryItem } from '@/types/client-dashboard';

/**
 * Fetch top queries for a client
 */
export const fetchTopQueries = async (
  clientId?: string,
  limit: number = 10
): Promise<QueryItem[]> => {
  try {
    let query = supabase
      .from('common_queries')
      .select('*')
      .order('frequency', { ascending: false })
      .limit(limit);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching top queries:', error);
      return [];
    }
    
    return (data || []).map(item => ({
      id: item.id,
      query_text: item.query_text,
      frequency: item.frequency,
      last_asked: item.updated_at,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error('Error in fetchTopQueries:', error);
    return [];
  }
};

// Legacy support
export const getTopQueries = fetchTopQueries;
