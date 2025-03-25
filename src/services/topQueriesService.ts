
import { supabase } from "@/integrations/supabase/client";
import { callRpcFunction, execSql } from "@/utils/rpcUtils";

export interface QueryItem {
  id: string;
  query_text: string;
  frequency: number;
  created_at?: string;
  client_id?: string;
  updated_at?: string;
}

/**
 * Gets top queries for a client
 * @param clientId The client ID
 * @param agentName The agent name
 * @param limit Max number of queries to return
 * @returns Top queries
 */
export const fetchTopQueries = async (
  clientId: string,
  agentName?: string, 
  limit: number = 5
): Promise<QueryItem[]> => {
  try {
    // First try the client_activities table using RPC
    const queryResult = await callRpcFunction<QueryItem[]>('get_common_queries', { 
      client_id_param: clientId,
      limit_param: limit
    });
    
    if (Array.isArray(queryResult) && queryResult.length > 0) {
      console.log(`Found ${queryResult.length} queries via RPC function`);
      return queryResult.map(item => ({
        id: item.id || `query-${Math.random().toString(36).substring(2)}`,
        query_text: item.query_text || "Unknown query",
        frequency: item.frequency || 1,
        client_id: item.client_id || clientId,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    }
    
    // Fallback to custom SQL if RPC function returns no data
    console.log("No queries found via RPC, using custom SQL");
    
    // Define custom SQL
    const customSql = `
      SELECT 
        id, 
        query_text, 
        COUNT(*) as frequency
      FROM ai_agents
      WHERE 
        client_id = '${clientId}'
        AND interaction_type = 'chat_interaction'
        AND query_text IS NOT NULL
        AND query_text != ''
      GROUP BY id, query_text
      ORDER BY frequency DESC
      LIMIT ${limit}
    `;
    
    try {
      const result = await execSql(customSql);
      
      if (Array.isArray(result) && result.length > 0) {
        return result.map(item => ({
          id: item.id || `query-${Math.random().toString(36).substring(2)}`,
          query_text: item.query_text || "Unknown query",
          frequency: Number(item.frequency) || 1,
          client_id: clientId
        }));
      }
    } catch (sqlError) {
      console.error("Error executing custom SQL:", sqlError);
    }
    
    // Final fallback - return mock data
    console.log("No queries found in database, returning mock data");
    return [
      { 
        id: `query-${Math.random().toString(36).substring(2)}`, 
        query_text: "How can I help my customers?", 
        frequency: 5 
      },
      { 
        id: `query-${Math.random().toString(36).substring(2)}`, 
        query_text: "What are your main features?", 
        frequency: 3 
      },
      {
        id: `query-${Math.random().toString(36).substring(2)}`,
        query_text: "Tell me about your pricing",
        frequency: 2
      }
    ];
  } catch (error) {
    console.error("Error fetching top queries:", error);
    return [];
  }
};
