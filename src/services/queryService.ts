
import { supabase } from '@/integrations/supabase/client';
import { QueryItem } from '@/types/client-dashboard';

/**
 * Fetch common queries for a client
 */
export const fetchCommonQueries = async (
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
      console.error('Error fetching common queries:', error);
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
    console.error('Error in fetchCommonQueries:', error);
    return [];
  }
};

/**
 * Record a query and increment its frequency
 */
export const recordQuery = async (
  query_text: string,
  clientId?: string
): Promise<QueryItem | null> => {
  try {
    // Check if the query exists
    const { data: existingQueries, error: fetchError } = await supabase
      .from('common_queries')
      .select('*')
      .eq('query_text', query_text)
      .eq('client_id', clientId || '')
      .limit(1);
    
    if (fetchError) {
      console.error('Error checking existing query:', fetchError);
      return null;
    }
    
    if (existingQueries && existingQueries.length > 0) {
      // Update the existing query
      const existingQuery = existingQueries[0];
      const { data: updatedQuery, error: updateError } = await supabase
        .from('common_queries')
        .update({
          frequency: existingQuery.frequency + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingQuery.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating query frequency:', updateError);
        return null;
      }
      
      return {
        id: updatedQuery.id,
        query_text: updatedQuery.query_text,
        frequency: updatedQuery.frequency,
        last_asked: updatedQuery.updated_at,
        created_at: updatedQuery.created_at
      };
    } else {
      // Create a new query
      const { data: newQuery, error: insertError } = await supabase
        .from('common_queries')
        .insert({
          query_text,
          client_id: clientId || null,
          frequency: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting new query:', insertError);
        return null;
      }
      
      return {
        id: newQuery.id,
        query_text: newQuery.query_text,
        frequency: newQuery.frequency,
        last_asked: newQuery.updated_at,
        created_at: newQuery.created_at
      };
    }
  } catch (error) {
    console.error('Error in recordQuery:', error);
    return null;
  }
};
