
import { supabase } from "@/integrations/supabase/client";
import { QueryItem } from "@/types/client-dashboard";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Fetches common queries for a specific client using the ai_agents table
 */
export const fetchQueries = async (clientId: string): Promise<QueryItem[]> => {
  try {
    // This query gets the most frequent queries from ai_agents table
    const { data, error } = await supabase.rpc('get_common_queries', {
      client_id_param: clientId,
      agent_name_param: null,  // Will get for all agent names for this client
      limit_param: 10
    });

    if (error) throw error;
    
    // Transform the data to match the QueryItem interface
    return (data || []).map((item: any) => ({
      id: crypto.randomUUID(), // Generate a random UUID since we don't have an ID from the group by
      query_text: item.query_text,
      frequency: item.frequency,
      client_id: clientId,
      created_at: new Date().toISOString(), // We don't have a created_at from the group by
      last_asked: new Date().toISOString() // Use current date since we don't have the actual last date
    }));
  } catch (err) {
    console.error("Error fetching common queries:", err);
    
    // Try a fallback approach with direct SQL if the RPC fails
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('query_text, created_at')
        .eq('client_id', clientId)
        .eq('interaction_type', 'chat_interaction')
        .not('query_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      // Count frequency of each query text and track last asked date
      const countMap = new Map<string, number>();
      const lastAskedMap = new Map<string, string>();
      
      data.forEach(item => {
        if (item.query_text) {
          // Increment count
          const count = countMap.get(item.query_text) || 0;
          countMap.set(item.query_text, count + 1);
          
          // Track the most recent date for this query
          const currentLastAsked = lastAskedMap.get(item.query_text);
          if (!currentLastAsked || new Date(item.created_at) > new Date(currentLastAsked)) {
            lastAskedMap.set(item.query_text, item.created_at);
          }
        }
      });
      
      // Convert to QueryItem[] format
      const result: QueryItem[] = Array.from(countMap).map(([queryText, frequency]) => ({
        id: crypto.randomUUID(),
        query_text: queryText,
        frequency,
        client_id: clientId,
        created_at: new Date().toISOString(),
        last_asked: lastAskedMap.get(queryText) || new Date().toISOString()
      }));
      
      return result;
    } catch (fallbackErr) {
      console.error("Fallback query also failed:", fallbackErr);
      throw fallbackErr;
    }
  }
};

/**
 * Sets up a realtime subscription for new queries
 */
export const subscribeToQueries = (
  clientId: string,
  onUpdate: () => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`queries-${clientId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ai_agents",
        filter: `client_id=eq.${clientId} AND interaction_type=eq.chat_interaction`
      },
      (payload) => {
        console.log("New query detected:", payload);
        onUpdate();
      }
    )
    .subscribe();

  return channel;
};
