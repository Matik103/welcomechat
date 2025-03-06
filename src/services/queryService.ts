
import { supabase } from "@/integrations/supabase/client";
import { QueryItem } from "@/types/client-dashboard";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches common queries for a specific client
 */
export const fetchQueries = async (clientId: string): Promise<QueryItem[]> => {
  if (!clientId) return [];
  
  // Try to ensure auth is valid before making the request
  const isAuthValid = await checkAndRefreshAuth();
  if (!isAuthValid) {
    return [];
  }
  
  // First try to get from common_queries table
  const { data: commonQueries, error: commonQueriesError } = await supabase
    .from("common_queries")
    .select("*")
    .eq("client_id", clientId)
    .order("frequency", { ascending: false })
    .limit(10);

  if (!commonQueriesError && commonQueries?.length > 0) {
    return (commonQueries || []).map((item: any) => ({
      id: item.id,
      query_text: item.query_text,
      frequency: item.frequency,
      last_asked: item.updated_at
    })) as QueryItem[];
  }
  
  // If no common queries found, try to extract from agent table
  try {
    // Get the agent_name for this client
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("agent_name")
      .eq("id", clientId)
      .single();
    
    if (clientError || !clientData) {
      console.error("Error fetching client agent name:", clientError);
      return [];
    }
    
    const sanitizedAgentName = clientData.agent_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Try to get user queries from the agent's table metadata using rpc
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: `SELECT id, metadata FROM "${sanitizedAgentName}" WHERE metadata IS NOT NULL ORDER BY id DESC LIMIT 100`
    });
    
    if (error || !data || !Array.isArray(data)) {
      console.log(`Error querying ${sanitizedAgentName} table:`, error);
      return [];
    }
    
    // Extract user queries from metadata and count frequency
    const queryMap: Record<string, { count: number, lastTimestamp: string }> = {};
    
    data.forEach(item => {
      if (item && item.metadata && item.metadata.user_message) {
        const query = item.metadata.user_message.trim();
        if (!queryMap[query]) {
          queryMap[query] = {
            count: 0,
            lastTimestamp: item.metadata.timestamp || new Date().toISOString()
          };
        }
        queryMap[query].count++;
        
        // Update last timestamp if this one is more recent
        if (item.metadata.timestamp && new Date(item.metadata.timestamp) > new Date(queryMap[query].lastTimestamp)) {
          queryMap[query].lastTimestamp = item.metadata.timestamp;
        }
      }
    });
    
    // Convert to QueryItem format and sort by frequency
    const queryItems: QueryItem[] = Object.entries(queryMap).map(([text, data]) => ({
      id: `agent-${text.substring(0, 10)}`,
      query_text: text,
      frequency: data.count,
      last_asked: data.lastTimestamp
    }));
    
    return queryItems
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  } catch (err) {
    console.error("Error processing agent data for queries:", err);
    return [];
  }
};

/**
 * Sets up a real-time subscription for common queries
 */
export const subscribeToQueries = (clientId: string, onUpdate: () => void) => {
  const channel = supabase
    .channel('queries-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'common_queries',
        filter: `client_id=eq.${clientId}`
      },
      (payload) => {
        console.log('Common queries changed:', payload);
        onUpdate();
      }
    )
    .subscribe();
    
  return channel;
};
