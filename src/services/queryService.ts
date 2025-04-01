
import { supabase } from "@/integrations/supabase/client";
import { QueryItem } from "@/types/client-dashboard";
import { safeString, safeNumber } from "@/utils/typeUtils";

/**
 * Get top queries for a specific client
 */
export const getTopQueries = async (
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
      frequency: safeNumber(item.frequency),
      last_asked: safeString(item.updated_at),
      created_at: safeString(item.created_at)
    }));
  } catch (error) {
    console.error('Error in getTopQueries:', error);
    return [];
  }
};

/**
 * Increment a query's frequency or create a new query record
 */
export const incrementQueryFrequency = async (
  clientId: string,
  queryText: string
): Promise<boolean> => {
  try {
    // First check if the query already exists
    const { data: existingQuery, error: fetchError } = await supabase
      .from('common_queries')
      .select('id, frequency')
      .eq('client_id', clientId)
      .eq('query_text', queryText)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching existing query:', fetchError);
      return false;
    }
    
    if (existingQuery) {
      // Increment existing query frequency
      const newFrequency = safeNumber(existingQuery.frequency) + 1;
      
      const { error } = await supabase
        .from('common_queries')
        .update({ 
          frequency: newFrequency,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingQuery.id);
        
      if (error) {
        console.error('Error incrementing query frequency:', error);
        return false;
      }
    } else {
      // Create new query
      const { error } = await supabase
        .from('common_queries')
        .insert({
          client_id: clientId,
          query_text: queryText,
          frequency: 1,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error creating new query:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error incrementing query frequency:', error);
    return false;
  }
};

/**
 * Manually add a common query
 */
export const addCommonQuery = async (
  clientId: string,
  queryText: string,
  frequency: number = 1
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('common_queries')
      .insert({
        client_id: clientId,
        query_text: queryText,
        frequency: safeNumber(frequency),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error adding common query:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error adding common query:', error);
    return false;
  }
};
