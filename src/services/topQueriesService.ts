
import { supabase } from '@/integrations/supabase/client';
import { QueryItem } from '@/types/client-dashboard';

export const fetchTopQueries = async (clientId: string, limit: number = 5): Promise<QueryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('common_queries')
      .select('id, query_text, frequency, created_at')
      .eq('client_id', clientId)
      .order('frequency', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top queries:', error);
      return [];
    }

    // Return the queries or an empty array if no data
    return data || [];
  } catch (error) {
    console.error('Error in fetchTopQueries:', error);
    return [];
  }
};

export default {
  fetchTopQueries
};
