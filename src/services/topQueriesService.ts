
import { supabase } from "@/integrations/supabase/client";
import { checkAndRefreshAuth } from "./authService";

/**
 * Fetches the top queries for a client
 */
export const fetchTopQueries = async (clientId: string): Promise<string[]> => {
  if (!clientId) return [];
  
  try {
    // Ensure auth is valid before making request
    const isAuthValid = await checkAndRefreshAuth();
    if (!isAuthValid) {
      throw new Error("Authentication failed");
    }
    
    // First try to get from common_queries table
    const { data: commonQueries, error: commonQueriesError } = await supabase
      .from("common_queries")
      .select("query_text")
      .eq("client_id", clientId)
      .order("frequency", { ascending: false })
      .limit(5);
    
    if (!commonQueriesError && commonQueries?.length > 0) {
      return commonQueries.map(q => q.query_text);
    }
    
    // If no common queries found, try to get from agent's table
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
    
    try {
      const { data, error } = await supabase
        .functions
        .invoke("dynamically-query-table", {
          body: {
            tableName: sanitizedAgentName,
            query: "SELECT metadata FROM \"${tableName}\" WHERE metadata IS NOT NULL ORDER BY id DESC LIMIT 50"
          }
        });

      if (error || !data || !Array.isArray(data)) {
        console.log(`Error querying ${sanitizedAgentName} table:`, error);
        return [];
      }
      
      // Extract user queries from metadata and count frequency
      const queryFrequency: Record<string, number> = {};
      
      data.forEach(item => {
        if (item && item.metadata && item.metadata.user_message) {
          const query = item.metadata.user_message.trim();
          queryFrequency[query] = (queryFrequency[query] || 0) + 1;
        }
      });
      
      // Sort queries by frequency and return top 5
      return Object.entries(queryFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([query]) => query);
    } catch (err) {
      console.error(`Error processing data from ${sanitizedAgentName} table:`, err);
      return [];
    }
  } catch (err) {
    console.error("Error fetching top queries:", err);
    return [];
  }
};
